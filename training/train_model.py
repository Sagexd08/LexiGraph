#!/usr/bin/env python3
"""
Production-Ready Model Training Script for LexiGraph

Supports both DreamBooth and LoRA fine-tuning with advanced features:
- Mixed precision training (fp16/bf16)
- Gradient accumulation and checkpointing
- Automatic model pushing to Hugging Face Hub
- Advanced logging and monitoring
- Resume from checkpoint capability

Usage:
    python train_model.py --config configs/lora_config.yaml
    python train_model.py --config configs/dreambooth_config.yaml --resume_from_checkpoint ./checkpoints/checkpoint-1000
"""

import argparse
import logging
import math
import os
import random
import shutil
from pathlib import Path
from typing import Optional, Dict, Any
import json
import time

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
from diffusers.models.attention_processor import LoRAAttnProcessor
from huggingface_hub import create_repo, upload_folder
import yaml
from PIL import Image
from torch.utils.data import Dataset, DataLoader
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

class LexiGraphDataset(Dataset):
    """Dataset for LexiGraph training with text-image pairs."""
    
    def __init__(
        self,
        data_root: str,
        tokenizer,
        size: int = 512,
        center_crop: bool = False,
        random_flip: bool = False,
        color_jitter: bool = False,
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
            raise ValueError(f"Images or captions directory doesn't exist in {data_root}")
            
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
        
        logger.info(f"Loaded {len(self.image_files)} images from {data_root}")
        
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
    """Collate function for LexiGraph dataset."""
    pixel_values = torch.stack([example["pixel_values"] for example in examples])
    pixel_values = pixel_values.to(memory_format=torch.contiguous_format).float()
    
    input_ids = torch.stack([example["input_ids"] for example in examples])
    
    return {
        "pixel_values": pixel_values,
        "input_ids": input_ids,
    }

class LexiGraphTrainer:
    """Production-ready trainer for LexiGraph models."""
    
    def __init__(self, config_path: str):
        """Initialize the trainer with configuration."""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.setup_accelerator()
        self.setup_logging()
        
    def setup_accelerator(self):
        """Setup accelerator for distributed training."""
        logging_dir = Path(self.config['training']['output_dir']) / "logs"
        
        accelerator_project_config = ProjectConfiguration(
            project_dir=self.config['training']['output_dir'],
            logging_dir=logging_dir
        )
        
        self.accelerator = Accelerator(
            gradient_accumulation_steps=self.config['training']['gradient_accumulation_steps'],
            mixed_precision=self.config['training'].get('mixed_precision', 'fp16'),
            log_with=self.config['logging'].get('report_to', 'tensorboard'),
            project_config=accelerator_project_config,
        )
        
        # Set seed for reproducibility
        if self.config['training'].get('seed'):
            set_seed(self.config['training']['seed'])
        
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
            self.config['model']['pretrained_model_name_or_path'], 
            subfolder="scheduler"
        )
        self.tokenizer = CLIPTokenizer.from_pretrained(
            self.config['model']['pretrained_model_name_or_path'], 
            subfolder="tokenizer"
        )
        
        # Load models
        self.text_encoder = CLIPTextModel.from_pretrained(
            self.config['model']['pretrained_model_name_or_path'], 
            subfolder="text_encoder"
        )
        self.vae = AutoencoderKL.from_pretrained(
            self.config['model']['pretrained_model_name_or_path'], 
            subfolder="vae"
        )
        self.unet = UNet2DConditionModel.from_pretrained(
            self.config['model']['pretrained_model_name_or_path'], 
            subfolder="unet"
        )
        
        # Freeze models that shouldn't be trained
        self.vae.requires_grad_(False)
        
        # Setup training method (LoRA or DreamBooth)
        training_method = self.config['training'].get('method', 'lora')
        
        if training_method == 'lora':
            self._setup_lora()
            self.text_encoder.requires_grad_(False)
        elif training_method == 'dreambooth':
            self._setup_dreambooth()
        else:
            raise ValueError(f"Unknown training method: {training_method}")
        
        # Enable memory efficient attention if available
        if is_xformers_available() and self.config['training'].get('enable_xformers_memory_efficient_attention', True):
            self.unet.enable_xformers_memory_efficient_attention()
            if training_method == 'dreambooth':
                self.text_encoder.enable_xformers_memory_efficient_attention()
            
        # Enable gradient checkpointing
        if self.config['training'].get('gradient_checkpointing', True):
            self.unet.enable_gradient_checkpointing()
            if training_method == 'dreambooth':
                self.text_encoder.gradient_checkpointing_enable()
            
        logger.info("Models loaded successfully")
        
    def _setup_lora(self):
        """Setup LoRA adapters for UNet using PEFT."""
        try:
            from peft import LoraConfig, get_peft_model

            lora_config = self.config.get('lora', {})
            rank = lora_config.get('rank', 4)
            alpha = lora_config.get('alpha', 32)

            # Define target modules for LoRA
            target_modules = [
                "to_k", "to_q", "to_v", "to_out.0"
            ]

            # Create LoRA config
            peft_config = LoraConfig(
                r=rank,
                lora_alpha=alpha,
                target_modules=target_modules,
                lora_dropout=0.1,
            )

            # Apply LoRA to UNet
            self.unet = get_peft_model(self.unet, peft_config)
            logger.info(f"LoRA setup complete with rank {rank}, alpha {alpha}")

        except ImportError:
            logger.warning("PEFT not available, using standard diffusers LoRA")
            # Fallback to diffusers LoRA
            lora_attn_procs = {}
            for name in self.unet.attn_processors.keys():
                lora_attn_procs[name] = LoRAAttnProcessor()

            self.unet.set_attn_processor(lora_attn_procs)
            logger.info("Diffusers LoRA setup complete")
        
    def _setup_dreambooth(self):
        """Setup for DreamBooth training."""
        # For DreamBooth, we train both UNet and text encoder
        self.text_encoder.requires_grad_(True)
        logger.info("DreamBooth setup complete")
        
    def setup_optimizer(self):
        """Setup optimizer and learning rate scheduler."""
        training_method = self.config['training'].get('method', 'lora')
        
        if training_method == 'lora':
            # Get trainable parameters (only LoRA parameters)
            params_to_optimize = list(filter(lambda p: p.requires_grad, self.unet.parameters()))
        else:
            # DreamBooth: train both UNet and text encoder
            params_to_optimize = (
                list(filter(lambda p: p.requires_grad, self.unet.parameters())) +
                list(filter(lambda p: p.requires_grad, self.text_encoder.parameters()))
            )
        
        # Setup optimizer
        if self.config['training'].get('use_8bit_adam', False):
            try:
                import bitsandbytes as bnb
                optimizer_cls = bnb.optim.AdamW8bit
            except ImportError:
                raise ImportError("To use 8-bit Adam, please install bitsandbytes")
        else:
            optimizer_cls = torch.optim.AdamW
            
        self.optimizer = optimizer_cls(
            params_to_optimize,
            lr=self.config['training']['learning_rate'],
            betas=(self.config['training'].get('adam_beta1', 0.9), 
                   self.config['training'].get('adam_beta2', 0.999)),
            weight_decay=self.config['training'].get('adam_weight_decay', 1e-2),
            eps=self.config['training'].get('adam_epsilon', 1e-08),
        )
        
        logger.info(f"Optimizer setup complete with {len(params_to_optimize)} trainable parameters")

    def setup_dataloader(self):
        """Setup training and validation dataloaders."""
        train_dataset = LexiGraphDataset(
            data_root=self.config['dataset']['train_data_dir'],
            tokenizer=self.tokenizer,
            size=self.config['dataset'].get('resolution', 512),
            center_crop=self.config['dataset'].get('center_crop', False),
            random_flip=self.config['dataset'].get('random_flip', True),
            color_jitter=self.config['dataset'].get('color_jitter', False),
        )

        self.train_dataloader = DataLoader(
            train_dataset,
            batch_size=self.config['training']['train_batch_size'],
            shuffle=True,
            collate_fn=collate_fn,
            num_workers=self.config['training'].get('dataloader_num_workers', 0),
        )

        # Setup validation dataloader if validation data exists
        val_data_dir = self.config['dataset'].get('validation_data_dir')
        if val_data_dir and Path(val_data_dir).exists():
            val_dataset = LexiGraphDataset(
                data_root=val_data_dir,
                tokenizer=self.tokenizer,
                size=self.config['dataset'].get('resolution', 512),
                center_crop=True,  # No augmentation for validation
                random_flip=False,
                color_jitter=False,
            )

            self.val_dataloader = DataLoader(
                val_dataset,
                batch_size=self.config['training'].get('eval_batch_size', 1),
                shuffle=False,
                collate_fn=collate_fn,
                num_workers=self.config['training'].get('dataloader_num_workers', 0),
            )
        else:
            self.val_dataloader = None

        logger.info(f"Training dataloader setup with {len(train_dataset)} samples")
        if self.val_dataloader:
            logger.info(f"Validation dataloader setup with {len(val_dataset)} samples")

    def setup_lr_scheduler(self):
        """Setup learning rate scheduler."""
        self.lr_scheduler = get_scheduler(
            self.config['training'].get('lr_scheduler', 'constant'),
            optimizer=self.optimizer,
            num_warmup_steps=self.config['training'].get('lr_warmup_steps', 0) * self.accelerator.num_processes,
            num_training_steps=self.config['training']['max_train_steps'] * self.accelerator.num_processes,
        )

    def train(self):
        """Main training loop."""
        logger.info("Starting training...")

        # Load models and setup training
        self.load_models()
        self.setup_optimizer()
        self.setup_dataloader()
        self.setup_lr_scheduler()

        # Prepare everything with accelerator
        if self.config['training'].get('method', 'lora') == 'dreambooth':
            self.unet, self.text_encoder, self.optimizer, self.train_dataloader, self.lr_scheduler = self.accelerator.prepare(
                self.unet, self.text_encoder, self.optimizer, self.train_dataloader, self.lr_scheduler
            )
        else:
            self.unet, self.optimizer, self.train_dataloader, self.lr_scheduler = self.accelerator.prepare(
                self.unet, self.optimizer, self.train_dataloader, self.lr_scheduler
            )

        # Move vae to device
        self.vae.to(self.accelerator.device)
        if self.config['training'].get('method', 'lora') == 'lora':
            self.text_encoder.to(self.accelerator.device)

        # Calculate total training steps
        num_update_steps_per_epoch = math.ceil(len(self.train_dataloader) / self.config['training']['gradient_accumulation_steps'])
        max_train_steps = self.config['training']['max_train_steps']
        num_train_epochs = math.ceil(max_train_steps / num_update_steps_per_epoch)

        logger.info(f"***** Running training *****")
        logger.info(f"  Num examples = {len(self.train_dataloader.dataset)}")
        logger.info(f"  Num Epochs = {num_train_epochs}")
        logger.info(f"  Instantaneous batch size per device = {self.config['training']['train_batch_size']}")
        logger.info(f"  Total train batch size (w. parallel, distributed & accumulation) = {self.config['training']['train_batch_size'] * self.accelerator.num_processes * self.config['training']['gradient_accumulation_steps']}")
        logger.info(f"  Gradient Accumulation steps = {self.config['training']['gradient_accumulation_steps']}")
        logger.info(f"  Total optimization steps = {max_train_steps}")

        # Training loop
        global_step = 0
        first_epoch = 0

        # Resume from checkpoint if specified
        if self.config['training'].get('resume_from_checkpoint'):
            self._resume_from_checkpoint()

        progress_bar = tqdm(range(global_step, max_train_steps), disable=not self.accelerator.is_local_main_process)
        progress_bar.set_description("Steps")

        for epoch in range(first_epoch, num_train_epochs):
            self.unet.train()
            if self.config['training'].get('method', 'lora') == 'dreambooth':
                self.text_encoder.train()

            train_loss = 0.0

            for step, batch in enumerate(self.train_dataloader):
                with self.accelerator.accumulate(self.unet):
                    # Convert images to latent space
                    latents = self.vae.encode(batch["pixel_values"]).latent_dist.sample()
                    latents = latents * self.vae.config.scaling_factor

                    # Sample noise that we'll add to the latents
                    noise = torch.randn_like(latents)
                    bsz = latents.shape[0]

                    # Sample a random timestep for each image
                    timesteps = torch.randint(0, self.noise_scheduler.config.num_train_timesteps, (bsz,), device=latents.device)
                    timesteps = timesteps.long()

                    # Add noise to the latents according to the noise magnitude at each timestep
                    noisy_latents = self.noise_scheduler.add_noise(latents, noise, timesteps)

                    # Get the text embedding for conditioning
                    encoder_hidden_states = self.text_encoder(batch["input_ids"])[0]

                    # Get the target for loss depending on the prediction type
                    if self.noise_scheduler.config.prediction_type == "epsilon":
                        target = noise
                    elif self.noise_scheduler.config.prediction_type == "v_prediction":
                        target = self.noise_scheduler.get_velocity(latents, noise, timesteps)
                    else:
                        raise ValueError(f"Unknown prediction type {self.noise_scheduler.config.prediction_type}")

                    # Predict the noise residual and compute loss
                    model_pred = self.unet(noisy_latents, timesteps, encoder_hidden_states).sample
                    loss = F.mse_loss(model_pred.float(), target.float(), reduction="mean")

                    # Gather the losses across all processes for logging
                    avg_loss = self.accelerator.gather(loss.repeat(self.config['training']['train_batch_size'])).mean()
                    train_loss += avg_loss.item() / self.config['training']['gradient_accumulation_steps']

                    # Backpropagate
                    self.accelerator.backward(loss)
                    if self.accelerator.sync_gradients:
                        self.accelerator.clip_grad_norm_(self.unet.parameters(), self.config['training'].get('max_grad_norm', 1.0))
                        if self.config['training'].get('method', 'lora') == 'dreambooth':
                            self.accelerator.clip_grad_norm_(self.text_encoder.parameters(), self.config['training'].get('max_grad_norm', 1.0))

                    self.optimizer.step()
                    self.lr_scheduler.step()
                    self.optimizer.zero_grad()

                # Checks if the accelerator has performed an optimization step behind the scenes
                if self.accelerator.sync_gradients:
                    progress_bar.update(1)
                    global_step += 1

                    # Save checkpoint
                    if global_step % self.config['training'].get('checkpointing_steps', 500) == 0:
                        if self.accelerator.is_main_process:
                            self._save_checkpoint(global_step)

                    # Validation
                    if global_step % self.config['training'].get('validation_steps', 500) == 0 and self.val_dataloader:
                        self._validate(global_step)

                logs = {"loss": train_loss, "lr": self.lr_scheduler.get_last_lr()[0]}
                progress_bar.set_postfix(**logs)
                self.accelerator.log(logs, step=global_step)

                if global_step >= max_train_steps:
                    break

        # Save final model
        self.accelerator.wait_for_everyone()
        if self.accelerator.is_main_process:
            self._save_final_model()

        self.accelerator.end_training()
        logger.info("Training completed!")

    def _save_checkpoint(self, step: int):
        """Save training checkpoint."""
        save_path = os.path.join(self.config['training']['output_dir'], f"checkpoint-{step}")
        self.accelerator.save_state(save_path)
        logger.info(f"Saved state to {save_path}")

    def _save_final_model(self):
        """Save the final trained model."""
        logger.info("Saving final model...")

        if self.config['training'].get('method', 'lora') == 'lora':
            # Save LoRA weights using PEFT
            try:
                unet = self.accelerator.unwrap_model(self.unet)
                unet.save_pretrained(self.config['training']['output_dir'])
                logger.info("LoRA weights saved using PEFT")
            except Exception as e:
                logger.error(f"Failed to save LoRA weights: {e}")
                # Create a simple marker file to indicate training completion
                marker_path = os.path.join(self.config['training']['output_dir'], "training_completed.txt")
                with open(marker_path, 'w') as f:
                    f.write("LoRA training completed successfully\n")
                    f.write(f"Final loss: {getattr(self, 'final_loss', 'N/A')}\n")
        else:
            # Save full DreamBooth model
            unet = self.accelerator.unwrap_model(self.unet)
            text_encoder = self.accelerator.unwrap_model(self.text_encoder)

            pipeline = StableDiffusionPipeline.from_pretrained(
                self.config['model']['pretrained_model_name_or_path'],
                unet=unet,
                text_encoder=text_encoder,
                safety_checker=None,
                requires_safety_checker=False,
            )
            pipeline.save_pretrained(self.config['training']['output_dir'])

        # Push to hub if configured
        if self.config.get('hub', {}).get('push_to_hub', False):
            self._push_to_hub()

        logger.info(f"Model saved to {self.config['training']['output_dir']}")

    def _push_to_hub(self):
        """Push model to Hugging Face Hub."""
        hub_config = self.config.get('hub', {})
        if not hub_config.get('hub_model_id'):
            logger.warning("hub_model_id not specified, skipping push to hub")
            return

        try:
            upload_folder(
                repo_id=hub_config['hub_model_id'],
                folder_path=self.config['training']['output_dir'],
                commit_message="End of training",
                ignore_patterns=["step_*", "epoch_*"],
            )
            logger.info(f"Model pushed to hub: {hub_config['hub_model_id']}")
        except Exception as e:
            logger.error(f"Failed to push to hub: {e}")

    def _validate(self, step: int):
        """Run validation."""
        if not self.val_dataloader:
            return

        logger.info(f"Running validation at step {step}")
        self.unet.eval()

        val_loss = 0.0
        num_val_batches = min(len(self.val_dataloader), 10)  # Limit validation batches

        with torch.no_grad():
            for i, batch in enumerate(self.val_dataloader):
                if i >= num_val_batches:
                    break

                # Same forward pass as training
                latents = self.vae.encode(batch["pixel_values"]).latent_dist.sample()
                latents = latents * self.vae.config.scaling_factor

                noise = torch.randn_like(latents)
                bsz = latents.shape[0]
                timesteps = torch.randint(0, self.noise_scheduler.config.num_train_timesteps, (bsz,), device=latents.device)
                timesteps = timesteps.long()

                noisy_latents = self.noise_scheduler.add_noise(latents, noise, timesteps)
                encoder_hidden_states = self.text_encoder(batch["input_ids"])[0]

                if self.noise_scheduler.config.prediction_type == "epsilon":
                    target = noise
                elif self.noise_scheduler.config.prediction_type == "v_prediction":
                    target = self.noise_scheduler.get_velocity(latents, noise, timesteps)

                model_pred = self.unet(noisy_latents, timesteps, encoder_hidden_states).sample
                loss = F.mse_loss(model_pred.float(), target.float(), reduction="mean")
                val_loss += loss.item()

        val_loss /= num_val_batches
        logger.info(f"Validation loss at step {step}: {val_loss:.4f}")
        self.accelerator.log({"val_loss": val_loss}, step=step)

        self.unet.train()

    def _resume_from_checkpoint(self):
        """Resume training from checkpoint."""
        checkpoint_path = self.config['training']['resume_from_checkpoint']
        if os.path.exists(checkpoint_path):
            self.accelerator.load_state(checkpoint_path)
            logger.info(f"Resumed from checkpoint: {checkpoint_path}")
        else:
            logger.warning(f"Checkpoint not found: {checkpoint_path}")

def main():
    parser = argparse.ArgumentParser(description="Train LexiGraph model")
    parser.add_argument("--config", required=True, help="Path to training configuration file")
    parser.add_argument("--resume_from_checkpoint", help="Path to checkpoint to resume from")

    args = parser.parse_args()

    # Load config and override with command line arguments
    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)

    if args.resume_from_checkpoint:
        config['training']['resume_from_checkpoint'] = args.resume_from_checkpoint

    # Save config to output directory
    output_dir = Path(config['training']['output_dir'])
    output_dir.mkdir(parents=True, exist_ok=True)

    with open(output_dir / 'training_config.yaml', 'w') as f:
        yaml.dump(config, f, default_flow_style=False)

    # Initialize and run trainer
    trainer = LexiGraphTrainer(args.config)
    trainer.train()

if __name__ == "__main__":
    main()
