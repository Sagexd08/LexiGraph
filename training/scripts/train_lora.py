#!/usr/bin/env python3
"""
LoRA Training Script for Lexigraph

Fine-tunes Stable Diffusion models using LoRA (Low-Rank Adaptation) technique.
More memory efficient than full fine-tuning while maintaining good performance.

Usage:
    python train_lora.py --config ../configs/lora_config.yaml
    python train_lora.py --config ../configs/lora_config.yaml --resume_from_checkpoint ./models/checkpoint-500
"""

import argparse
import logging
import math
import os
import random
import shutil
from pathlib import Path
from typing import Optional

import numpy as np
import torch
import torch.nn.functional as F
import torch.utils.checkpoint
from accelerate import Accelerator
from accelerate.logging import get_logger
from accelerate.utils import ProjectConfiguration, set_seed
from datasets import load_dataset
from diffusers import (
    AutoencoderKL,
    DDPMScheduler,
    DiffusionPipeline,
    DPMSolverMultistepScheduler,
    StableDiffusionPipeline,
    UNet2DConditionModel,
)
from diffusers.optimization import get_scheduler
from diffusers.training_utils import EMAModel
from diffusers.utils import check_min_version, is_wandb_available
from diffusers.utils.import_utils import is_xformers_available
from huggingface_hub import create_repo, upload_folder
from omegaconf import OmegaConf
from peft import LoraConfig, get_peft_model, TaskType
from PIL import Image
from torch.utils.data import Dataset
from torchvision import transforms
from tqdm.auto import tqdm
from transformers import CLIPTextModel, CLIPTokenizer

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
    datefmt="%m/%d/%Y %H:%M:%S",
    level=logging.INFO,
)
logger = get_logger(__name__)

# Check minimum diffusers version
check_min_version("0.21.0")

class LoRADataset(Dataset):
    """Dataset for LoRA training with text-image pairs."""
    
    def __init__(
        self,
        data_root,
        tokenizer,
        size=512,
        center_crop=False,
        random_flip=False,
        color_jitter=False,
    ):
        self.data_root = Path(data_root)
        self.tokenizer = tokenizer
        self.size = size
        self.center_crop = center_crop
        self.random_flip = random_flip
        self.color_jitter = color_jitter
        
        # Load images and captions
        self.images_dir = self.data_root / 'images'
        self.captions_dir = self.data_root / 'captions'
        
        if not self.images_dir.exists() or not self.captions_dir.exists():
            raise ValueError("Images or captions directory doesn't exist.")
            
        self.image_files = list(self.images_dir.glob('*.jpg')) + list(self.images_dir.glob('*.jpeg'))
        self.image_files = sorted(self.image_files)
        
        # Load captions
        self.captions = []
        for image_file in self.image_files:
            caption_file = self.captions_dir / f"{image_file.stem}.txt"
            if caption_file.exists():
                with open(caption_file, 'r', encoding='utf-8') as f:
                    caption = f.read().strip()
                self.captions.append(caption)
            else:
                self.captions.append(f"A photo of {image_file.stem}")
                
        # Image transforms
        self.image_transforms = transforms.Compose([
            transforms.Resize(size, interpolation=transforms.InterpolationMode.BILINEAR),
            transforms.CenterCrop(size) if center_crop else transforms.RandomCrop(size),
            transforms.RandomHorizontalFlip() if random_flip else transforms.Lambda(lambda x: x),
            transforms.ColorJitter(0.1, 0.1) if color_jitter else transforms.Lambda(lambda x: x),
            transforms.ToTensor(),
            transforms.Normalize([0.5], [0.5]),
        ])
        
    def __len__(self):
        return len(self.image_files)
        
    def __getitem__(self, index):
        # Load and process image
        image = Image.open(self.image_files[index]).convert("RGB")
        image = self.image_transforms(image)
        
        # Process caption
        caption = self.captions[index]
        input_ids = self.tokenizer(
            caption,
            truncation=True,
            padding="max_length",
            max_length=self.tokenizer.model_max_length,
            return_tensors="pt",
        ).input_ids[0]
        
        return {
            "pixel_values": image,
            "input_ids": input_ids,
        }

def collate_fn(examples):
    """Collate function for LoRA dataset."""
    pixel_values = torch.stack([example["pixel_values"] for example in examples])
    pixel_values = pixel_values.to(memory_format=torch.contiguous_format).float()
    
    input_ids = torch.stack([example["input_ids"] for example in examples])
    
    return {
        "pixel_values": pixel_values,
        "input_ids": input_ids,
    }

class LoRATrainer:
    """Main trainer class for LoRA fine-tuning."""
    
    def __init__(self, config_path: str):
        """Initialize the LoRA trainer with configuration."""
        self.config = OmegaConf.load(config_path)
        self.setup_accelerator()
        self.setup_logging()
        
    def setup_accelerator(self):
        """Setup accelerator for distributed training."""
        logging_dir = Path(self.config.training.output_dir, self.config.logging.logging_dir)
        
        accelerator_project_config = ProjectConfiguration(
            project_dir=self.config.training.output_dir,
            logging_dir=logging_dir
        )
        
        self.accelerator = Accelerator(
            gradient_accumulation_steps=self.config.training.gradient_accumulation_steps,
            mixed_precision=self.config.memory.mixed_precision,
            log_with=self.config.logging.report_to,
            project_config=accelerator_project_config,
        )
        
    def setup_logging(self):
        """Setup logging configuration."""
        if self.accelerator.is_local_main_process:
            logging.basicConfig(
                format="%(asctime)s - %(levelname)s - %(name)s - %(message)s",
                datefmt="%m/%d/%Y %H:%M:%S",
                level=logging.INFO,
            )
        else:
            logging.basicConfig(level=logging.ERROR)
            
    def load_models(self):
        """Load and setup all required models."""
        logger.info("Loading models...")
        
        # Load scheduler, tokenizer and models
        self.noise_scheduler = DDPMScheduler.from_pretrained(
            self.config.model.pretrained_model_name_or_path, 
            subfolder="scheduler"
        )
        self.tokenizer = CLIPTokenizer.from_pretrained(
            self.config.model.pretrained_model_name_or_path, 
            subfolder="tokenizer"
        )
        
        # Load models
        self.text_encoder = CLIPTextModel.from_pretrained(
            self.config.model.pretrained_model_name_or_path, 
            subfolder="text_encoder"
        )
        self.vae = AutoencoderKL.from_pretrained(
            self.config.model.pretrained_model_name_or_path, 
            subfolder="vae"
        )
        self.unet = UNet2DConditionModel.from_pretrained(
            self.config.model.pretrained_model_name_or_path, 
            subfolder="unet"
        )
        
        # Freeze models that shouldn't be trained
        self.vae.requires_grad_(False)
        self.text_encoder.requires_grad_(False)
        
        # Setup LoRA for UNet
        lora_config = LoraConfig(
            r=self.config.lora.rank,
            lora_alpha=self.config.lora.alpha,
            target_modules=self.config.lora.target_modules,
            lora_dropout=self.config.lora.dropout,
            bias=self.config.lora.bias,
            task_type=TaskType.DIFFUSION_IMAGE_GENERATION,
        )
        
        self.unet = get_peft_model(self.unet, lora_config)
        
        # Enable memory efficient attention if available
        if is_xformers_available() and self.config.memory.enable_xformers_memory_efficient_attention:
            self.unet.enable_xformers_memory_efficient_attention()
            
        # Enable gradient checkpointing
        if self.config.memory.gradient_checkpointing:
            self.unet.enable_gradient_checkpointing()
            
        logger.info("Models loaded successfully")
        logger.info(f"LoRA trainable parameters: {self.unet.get_nb_trainable_parameters()}")
        
    def setup_optimizer(self):
        """Setup optimizer and learning rate scheduler."""
        # Setup optimizer
        if self.config.training.use_8bit_adam:
            try:
                import bitsandbytes as bnb
                optimizer_cls = bnb.optim.AdamW8bit
            except ImportError:
                raise ImportError("To use 8-bit Adam, please install bitsandbytes")
        else:
            optimizer_cls = torch.optim.AdamW
            
        # Get trainable parameters (only LoRA parameters)
        params_to_optimize = list(filter(lambda p: p.requires_grad, self.unet.parameters()))
        
        self.optimizer = optimizer_cls(
            params_to_optimize,
            lr=self.config.training.learning_rate,
            betas=(self.config.training.adam_beta1, self.config.training.adam_beta2),
            weight_decay=self.config.training.adam_weight_decay,
            eps=self.config.training.adam_epsilon,
        )
        
        logger.info("Optimizer setup complete")
        
    def setup_dataset(self):
        """Setup training dataset and dataloader."""
        train_dataset = LoRADataset(
            data_root=self.config.dataset.train_data_dir,
            tokenizer=self.tokenizer,
            size=self.config.dataset.resolution,
            center_crop=self.config.dataset.center_crop,
            random_flip=self.config.dataset.random_flip,
            color_jitter=self.config.dataset.color_jitter,
        )
        
        self.train_dataloader = torch.utils.data.DataLoader(
            train_dataset,
            batch_size=self.config.training.train_batch_size,
            shuffle=True,
            collate_fn=collate_fn,
            num_workers=self.config.training.dataloader_num_workers,
        )
        
        logger.info(f"Dataset setup complete. Training samples: {len(train_dataset)}")
        
    def setup_lr_scheduler(self):
        """Setup learning rate scheduler."""
        self.lr_scheduler = get_scheduler(
            self.config.training.lr_scheduler,
            optimizer=self.optimizer,
            num_warmup_steps=self.config.training.lr_warmup_steps * self.accelerator.num_processes,
            num_training_steps=self.config.training.max_train_steps * self.accelerator.num_processes,
            num_cycles=self.config.training.lr_num_cycles,
            power=self.config.training.lr_power,
        )
        
    def train(self):
        """Main training loop."""
        logger.info("Starting LoRA training...")
        
        # Setup everything
        self.load_models()
        self.setup_optimizer()
        self.setup_dataset()
        self.setup_lr_scheduler()
        
        # Prepare everything with accelerator
        self.unet, self.optimizer, self.train_dataloader, self.lr_scheduler = self.accelerator.prepare(
            self.unet, self.optimizer, self.train_dataloader, self.lr_scheduler
        )
        
        # Move models to device
        self.vae.to(self.accelerator.device, dtype=torch.float32)
        self.text_encoder.to(self.accelerator.device)
        
        # Calculate total training steps
        num_update_steps_per_epoch = math.ceil(len(self.train_dataloader) / self.config.training.gradient_accumulation_steps)
        if self.config.training.max_train_steps is None:
            self.config.training.max_train_steps = self.config.training.num_train_epochs * num_update_steps_per_epoch
            
        # Set seed for reproducibility
        if self.config.training.seed is not None:
            set_seed(self.config.training.seed)
            
        # Training loop
        total_batch_size = self.config.training.train_batch_size * self.accelerator.num_processes * self.config.training.gradient_accumulation_steps
        
        logger.info("***** Running training *****")
        logger.info(f"  Num examples = {len(self.train_dataloader.dataset)}")
        logger.info(f"  Num batches each epoch = {len(self.train_dataloader)}")
        logger.info(f"  Num Epochs = {self.config.training.num_train_epochs}")
        logger.info(f"  Instantaneous batch size per device = {self.config.training.train_batch_size}")
        logger.info(f"  Total train batch size (w. parallel, distributed & accumulation) = {total_batch_size}")
        logger.info(f"  Gradient Accumulation steps = {self.config.training.gradient_accumulation_steps}")
        logger.info(f"  Total optimization steps = {self.config.training.max_train_steps}")
        
        global_step = 0
        first_epoch = 0
        
        # Training progress bar
        progress_bar = tqdm(
            range(0, self.config.training.max_train_steps),
            initial=global_step,
            desc="Steps",
            disable=not self.accelerator.is_local_main_process,
        )
        
        for epoch in range(first_epoch, self.config.training.num_train_epochs):
            self.unet.train()
            
            for step, batch in enumerate(self.train_dataloader):
                with self.accelerator.accumulate(self.unet):
                    # Convert images to latent space
                    latents = self.vae.encode(batch["pixel_values"].to(dtype=self.vae.dtype)).latent_dist.sample()
                    latents = latents * self.vae.config.scaling_factor
                    
                    # Sample noise
                    noise = torch.randn_like(latents)
                    bsz = latents.shape[0]
                    
                    # Sample a random timestep for each image
                    timesteps = torch.randint(0, self.noise_scheduler.config.num_train_timesteps, (bsz,), device=latents.device)
                    timesteps = timesteps.long()
                    
                    # Add noise to the latents according to the noise magnitude at each timestep
                    noisy_latents = self.noise_scheduler.add_noise(latents, noise, timesteps)
                    
                    # Get the text embedding for conditioning
                    encoder_hidden_states = self.text_encoder(batch["input_ids"])[0]
                    
                    # Predict the noise residual
                    model_pred = self.unet(noisy_latents, timesteps, encoder_hidden_states).sample
                    
                    # Get the target for loss depending on the prediction type
                    if self.noise_scheduler.config.prediction_type == "epsilon":
                        target = noise
                    elif self.noise_scheduler.config.prediction_type == "v_prediction":
                        target = self.noise_scheduler.get_velocity(latents, noise, timesteps)
                    else:
                        raise ValueError(f"Unknown prediction type {self.noise_scheduler.config.prediction_type}")
                        
                    loss = F.mse_loss(model_pred.float(), target.float(), reduction="mean")
                    
                    # Gather the losses across all processes for logging
                    avg_loss = self.accelerator.gather(loss.repeat(self.config.training.train_batch_size)).mean()
                    
                    # Backpropagate
                    self.accelerator.backward(loss)
                    if self.accelerator.sync_gradients:
                        params_to_clip = list(filter(lambda p: p.requires_grad, self.unet.parameters()))
                        self.accelerator.clip_grad_norm_(params_to_clip, self.config.training.max_grad_norm)
                        
                    self.optimizer.step()
                    self.lr_scheduler.step()
                    self.optimizer.zero_grad(set_to_none=self.config.memory.set_grads_to_none)
                    
                # Checks if the accelerator has performed an optimization step behind the scenes
                if self.accelerator.sync_gradients:
                    progress_bar.update(1)
                    global_step += 1
                    
                    # Save checkpoint
                    if global_step % self.config.training.checkpointing_steps == 0:
                        if self.accelerator.is_main_process:
                            save_path = os.path.join(self.config.training.output_dir, f"checkpoint-{global_step}")
                            self.accelerator.save_state(save_path)
                            logger.info(f"Saved state to {save_path}")
                            
                logs = {"loss": avg_loss.detach().item(), "lr": self.lr_scheduler.get_last_lr()[0]}
                progress_bar.set_postfix(**logs)
                self.accelerator.log(logs, step=global_step)
                
                if global_step >= self.config.training.max_train_steps:
                    break
                    
        # Save final LoRA weights
        self.accelerator.wait_for_everyone()
        if self.accelerator.is_main_process:
            self.save_lora_weights()
            
        self.accelerator.end_training()
        
    def save_lora_weights(self):
        """Save the trained LoRA weights."""
        logger.info("Saving LoRA weights...")
        
        unet = self.accelerator.unwrap_model(self.unet)
        unet.save_pretrained(self.config.training.output_dir)
        
        # Also save a complete pipeline for easy inference
        pipeline = StableDiffusionPipeline.from_pretrained(
            self.config.model.pretrained_model_name_or_path,
            unet=unet,
            safety_checker=None,
            requires_safety_checker=False,
        )
        
        pipeline.save_pretrained(os.path.join(self.config.training.output_dir, "pipeline"))
        
        # Push to hub if configured
        if self.config.hub.push_to_hub:
            upload_folder(
                repo_id=self.config.hub.hub_model_id,
                folder_path=self.config.training.output_dir,
                commit_message="End of training",
                ignore_patterns=["step_*", "epoch_*"],
            )
            
        logger.info(f"LoRA weights saved to {self.config.training.output_dir}")

def main():
    """Main function to run LoRA training."""
    parser = argparse.ArgumentParser(description="Train a LoRA model")
    parser.add_argument("--config", required=True, help="Path to training configuration file")
    parser.add_argument("--resume_from_checkpoint", help="Path to checkpoint to resume from")
    
    args = parser.parse_args()
    
    # Override config with command line arguments
    config = OmegaConf.load(args.config)
    if args.resume_from_checkpoint:
        config.training.resume_from_checkpoint = args.resume_from_checkpoint
        
    # Initialize and run trainer
    trainer = LoRATrainer(args.config)
    trainer.train()

if __name__ == "__main__":
    main()
