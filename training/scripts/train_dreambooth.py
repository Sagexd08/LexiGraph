#!/usr/bin/env python3
"""
DreamBooth Training Script for Lexigraph

Fine-tunes Stable Diffusion models using DreamBooth technique for personalized image generation.
Supports custom datasets, regularization, and various optimization techniques.

Usage:
    python train_dreambooth.py --config ../configs/dreambooth_config.yaml
    python train_dreambooth.py --config ../configs/dreambooth_config.yaml --resume_from_checkpoint ./models/checkpoint-100
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

class DreamBoothDataset(Dataset):
    """Dataset for DreamBooth training with instance and class images."""
    
    def __init__(
        self,
        instance_data_root,
        instance_prompt,
        tokenizer,
        class_data_root=None,
        class_prompt=None,
        class_num=None,
        size=512,
        center_crop=False,
        color_jitter=False,
    ):
        self.size = size
        self.center_crop = center_crop
        self.tokenizer = tokenizer
        self.color_jitter = color_jitter

        self.instance_data_root = Path(instance_data_root)
        if not self.instance_data_root.exists():
            raise ValueError("Instance images root doesn't exist.")

        self.instance_images_path = list(Path(instance_data_root).iterdir())
        self.num_instance_images = len(self.instance_images_path)
        self.instance_prompt = instance_prompt
        self._length = self.num_instance_images

        if class_data_root is not None:
            self.class_data_root = Path(class_data_root)
            self.class_data_root.mkdir(parents=True, exist_ok=True)
            self.class_images_path = list(self.class_data_root.iterdir())
            if class_num is not None:
                self.num_class_images = min(len(self.class_images_path), class_num)
            else:
                self.num_class_images = len(self.class_images_path)
            self._length = max(self.num_class_images, self.num_instance_images)
            self.class_prompt = class_prompt
        else:
            self.class_data_root = None

        self.image_transforms = transforms.Compose(
            [
                transforms.Resize(size, interpolation=transforms.InterpolationMode.BILINEAR),
                transforms.CenterCrop(size) if center_crop else transforms.RandomCrop(size),
                transforms.ColorJitter(0.1, 0.1) if color_jitter else transforms.Lambda(lambda x: x),
                transforms.ToTensor(),
                transforms.Normalize([0.5], [0.5]),
            ]
        )

    def __len__(self):
        return self._length

    def __getitem__(self, index):
        example = {}
        instance_image = Image.open(self.instance_images_path[index % self.num_instance_images])
        instance_image = instance_image.convert("RGB")
        example["instance_images"] = self.image_transforms(instance_image)
        example["instance_prompt_ids"] = self.tokenizer(
            self.instance_prompt,
            truncation=True,
            padding="max_length",
            max_length=self.tokenizer.model_max_length,
            return_tensors="pt",
        ).input_ids

        if self.class_data_root:
            class_image = Image.open(self.class_images_path[index % self.num_class_images])
            class_image = class_image.convert("RGB")
            example["class_images"] = self.image_transforms(class_image)
            example["class_prompt_ids"] = self.tokenizer(
                self.class_prompt,
                truncation=True,
                padding="max_length",
                max_length=self.tokenizer.model_max_length,
                return_tensors="pt",
            ).input_ids

        return example

def collate_fn(examples, with_prior_preservation=False):
    """Collate function for DreamBooth dataset."""
    has_attention_mask = "instance_attention_mask" in examples[0]

    input_ids = [example["instance_prompt_ids"] for example in examples]
    pixel_values = [example["instance_images"] for example in examples]

    if has_attention_mask:
        attention_mask = [example["instance_attention_mask"] for example in examples]

    # Concat class and instance examples for prior preservation.
    # We do this to avoid doing two forward passes.
    if with_prior_preservation:
        input_ids += [example["class_prompt_ids"] for example in examples]
        pixel_values += [example["class_images"] for example in examples]
        if has_attention_mask:
            attention_mask += [example["class_attention_mask"] for example in examples]

    pixel_values = torch.stack(pixel_values)
    pixel_values = pixel_values.to(memory_format=torch.contiguous_format).float()

    input_ids = torch.cat(input_ids, dim=0)

    batch = {
        "input_ids": input_ids,
        "pixel_values": pixel_values,
    }

    if has_attention_mask:
        attention_mask = torch.cat(attention_mask, dim=0)
        batch["attention_mask"] = attention_mask

    return batch

class DreamBoothTrainer:
    """Main trainer class for DreamBooth fine-tuning."""
    
    def __init__(self, config_path: str):
        """Initialize the DreamBooth trainer with configuration."""
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
        if not self.config.dataset.train_text_encoder:
            self.text_encoder.requires_grad_(False)
            
        # Enable memory efficient attention if available
        if is_xformers_available() and self.config.memory.enable_xformers_memory_efficient_attention:
            self.unet.enable_xformers_memory_efficient_attention()
            if self.config.dataset.train_text_encoder:
                self.text_encoder.enable_xformers_memory_efficient_attention()
                
        # Enable gradient checkpointing
        if self.config.memory.gradient_checkpointing:
            self.unet.enable_gradient_checkpointing()
            if self.config.dataset.train_text_encoder:
                self.text_encoder.gradient_checkpointing_enable()
                
        logger.info("Models loaded successfully")
        
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
            
        # Get trainable parameters
        params_to_optimize = list(self.unet.parameters())
        if self.config.dataset.train_text_encoder:
            params_to_optimize += list(self.text_encoder.parameters())
            
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
        train_dataset = DreamBoothDataset(
            instance_data_root=self.config.dataset.instance_data_dir,
            instance_prompt=self.config.dataset.instance_prompt,
            class_data_root=self.config.dataset.class_data_dir if self.config.dataset.with_prior_preservation else None,
            class_prompt=self.config.dataset.class_prompt,
            class_num=self.config.dataset.num_class_images,
            tokenizer=self.tokenizer,
            size=self.config.dataset.resolution,
            center_crop=self.config.dataset.center_crop,
            color_jitter=self.config.dataset.color_jitter,
        )
        
        self.train_dataloader = torch.utils.data.DataLoader(
            train_dataset,
            batch_size=self.config.training.train_batch_size,
            shuffle=True,
            collate_fn=lambda examples: collate_fn(examples, self.config.dataset.with_prior_preservation),
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
        logger.info("Starting DreamBooth training...")
        
        # Setup everything
        self.load_models()
        self.setup_optimizer()
        self.setup_dataset()
        self.setup_lr_scheduler()
        
        # Prepare everything with accelerator
        if self.config.dataset.train_text_encoder:
            self.unet, self.text_encoder, self.optimizer, self.train_dataloader, self.lr_scheduler = self.accelerator.prepare(
                self.unet, self.text_encoder, self.optimizer, self.train_dataloader, self.lr_scheduler
            )
        else:
            self.unet, self.optimizer, self.train_dataloader, self.lr_scheduler = self.accelerator.prepare(
                self.unet, self.optimizer, self.train_dataloader, self.lr_scheduler
            )
            
        # Move models to device
        self.vae.to(self.accelerator.device, dtype=torch.float32)
        if not self.config.dataset.train_text_encoder:
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
        
        # Resume from checkpoint if available
        if self.config.training.resume_from_checkpoint:
            if self.config.training.resume_from_checkpoint != "latest":
                path = os.path.basename(self.config.training.resume_from_checkpoint)
            else:
                dirs = os.listdir(self.config.training.output_dir)
                dirs = [d for d in dirs if d.startswith("checkpoint")]
                dirs = sorted(dirs, key=lambda x: int(x.split("-")[1]))
                path = dirs[-1] if len(dirs) > 0 else None

            if path is None:
                logger.info("No checkpoint found, starting from scratch")
            else:
                logger.info(f"Resuming from checkpoint {path}")
                self.accelerator.load_state(os.path.join(self.config.training.output_dir, path))
                global_step = int(path.split("-")[1])

                resume_global_step = global_step * self.config.training.gradient_accumulation_steps
                first_epoch = global_step // num_update_steps_per_epoch
                resume_step = resume_global_step - (first_epoch * len(self.train_dataloader))
                
        # Training progress bar
        progress_bar = tqdm(
            range(0, self.config.training.max_train_steps),
            initial=global_step,
            desc="Steps",
            disable=not self.accelerator.is_local_main_process,
        )
        
        for epoch in range(first_epoch, self.config.training.num_train_epochs):
            self.unet.train()
            if self.config.dataset.train_text_encoder:
                self.text_encoder.train()
                
            for step, batch in enumerate(self.train_dataloader):
                # Skip steps until we reach the resumed step
                if self.config.training.resume_from_checkpoint and epoch == first_epoch and step < resume_step:
                    if step % self.config.training.gradient_accumulation_steps == 0:
                        progress_bar.update(1)
                    continue
                    
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
                    
                    # Get the target for loss depending on the prediction type
                    if self.config.advanced.prediction_type is not None:
                        if self.config.advanced.prediction_type == "epsilon":
                            target = noise
                        elif self.config.advanced.prediction_type == "v_prediction":
                            target = self.noise_scheduler.get_velocity(latents, noise, timesteps)
                        else:
                            raise ValueError(f"Unknown prediction type {self.config.advanced.prediction_type}")
                    else:
                        if self.noise_scheduler.config.prediction_type == "epsilon":
                            target = noise
                        elif self.noise_scheduler.config.prediction_type == "v_prediction":
                            target = self.noise_scheduler.get_velocity(latents, noise, timesteps)
                        else:
                            raise ValueError(f"Unknown prediction type {self.noise_scheduler.config.prediction_type}")
                            
                    # Predict the noise residual and compute loss
                    model_pred = self.unet(noisy_latents, timesteps, encoder_hidden_states).sample
                    
                    if self.config.dataset.with_prior_preservation:
                        # Chunk the noise and model_pred into two parts and compute the loss on each part separately.
                        model_pred, model_pred_prior = torch.chunk(model_pred, 2, dim=0)
                        target, target_prior = torch.chunk(target, 2, dim=0)
                        
                        # Compute instance loss
                        loss = F.mse_loss(model_pred.float(), target.float(), reduction="mean")
                        
                        # Compute prior loss
                        prior_loss = F.mse_loss(model_pred_prior.float(), target_prior.float(), reduction="mean")
                        
                        # Add the prior loss to the instance loss.
                        loss = loss + prior_loss
                    else:
                        loss = F.mse_loss(model_pred.float(), target.float(), reduction="mean")
                        
                    # Gather the losses across all processes for logging (if we use distributed training).
                    avg_loss = self.accelerator.gather(loss.repeat(self.config.training.train_batch_size)).mean()
                    
                    # Backpropagate
                    self.accelerator.backward(loss)
                    if self.accelerator.sync_gradients:
                        params_to_clip = (
                            list(self.unet.parameters()) + list(self.text_encoder.parameters())
                            if self.config.dataset.train_text_encoder
                            else list(self.unet.parameters())
                        )
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
                            # _before_ saving state, check if this save would set us over the `checkpoints_total_limit`
                            if self.config.training.checkpoints_total_limit is not None:
                                checkpoints = os.listdir(self.config.training.output_dir)
                                checkpoints = [d for d in checkpoints if d.startswith("checkpoint")]
                                checkpoints = sorted(checkpoints, key=lambda x: int(x.split("-")[1]))
                                
                                # before we save the new checkpoint, we need to have at _most_ `checkpoints_total_limit - 1` checkpoints
                                if len(checkpoints) >= self.config.training.checkpoints_total_limit:
                                    num_to_remove = len(checkpoints) - self.config.training.checkpoints_total_limit + 1
                                    removing_checkpoints = checkpoints[0:num_to_remove]
                                    
                                    logger.info(f"Removing {len(removing_checkpoints)} checkpoints to stay under limit")
                                    for removing_checkpoint in removing_checkpoints:
                                        removing_checkpoint = os.path.join(self.config.training.output_dir, removing_checkpoint)
                                        shutil.rmtree(removing_checkpoint)
                                        
                            save_path = os.path.join(self.config.training.output_dir, f"checkpoint-{global_step}")
                            self.accelerator.save_state(save_path)
                            logger.info(f"Saved state to {save_path}")
                            
                logs = {"loss": avg_loss.detach().item(), "lr": self.lr_scheduler.get_last_lr()[0]}
                progress_bar.set_postfix(**logs)
                self.accelerator.log(logs, step=global_step)
                
                if global_step >= self.config.training.max_train_steps:
                    break
                    
        # Create the pipeline using the trained modules and save it.
        self.accelerator.wait_for_everyone()
        if self.accelerator.is_main_process:
            self.save_pipeline()
            
        self.accelerator.end_training()
        
    def save_pipeline(self):
        """Save the trained pipeline."""
        logger.info("Saving pipeline...")
        
        unet = self.accelerator.unwrap_model(self.unet)
        if self.config.dataset.train_text_encoder:
            text_encoder = self.accelerator.unwrap_model(self.text_encoder)
        else:
            text_encoder = self.text_encoder
            
        pipeline = StableDiffusionPipeline.from_pretrained(
            self.config.model.pretrained_model_name_or_path,
            unet=unet,
            text_encoder=text_encoder,
            vae=self.vae,
            safety_checker=None,
            requires_safety_checker=False,
        )
        
        pipeline.save_pretrained(self.config.training.output_dir)
        
        # Push to hub if configured
        if self.config.hub.push_to_hub:
            upload_folder(
                repo_id=self.config.hub.hub_model_id,
                folder_path=self.config.training.output_dir,
                commit_message="End of training",
                ignore_patterns=["step_*", "epoch_*"],
            )
            
        logger.info(f"Pipeline saved to {self.config.training.output_dir}")

def main():
    """Main function to run DreamBooth training."""
    parser = argparse.ArgumentParser(description="Train a DreamBooth model")
    parser.add_argument("--config", required=True, help="Path to training configuration file")
    parser.add_argument("--resume_from_checkpoint", help="Path to checkpoint to resume from")
    
    args = parser.parse_args()
    
    # Override config with command line arguments
    config = OmegaConf.load(args.config)
    if args.resume_from_checkpoint:
        config.training.resume_from_checkpoint = args.resume_from_checkpoint
        
    # Initialize and run trainer
    trainer = DreamBoothTrainer(args.config)
    trainer.train()

if __name__ == "__main__":
    main()
