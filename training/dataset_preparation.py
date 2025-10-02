#!/usr/bin/env python3
"""
Advanced Dataset Preparation Script for LexiGraph

Prepares image datasets for training by resizing, normalizing, and organizing images
with their corresponding captions for DreamBooth/LoRA fine-tuning.
Includes automatic caption generation using BLIP and advanced augmentation options.

Usage:
    python dataset_preparation.py --input_dir ./raw_images --output_dir ./processed --resolution 512
    python dataset_preparation.py --input_dir ./raw_images --output_dir ./processed --auto_caption --augment
"""

import argparse
import logging
import os
import shutil
from pathlib import Path
from typing import List, Tuple, Optional
import json
import random
from concurrent.futures import ThreadPoolExecutor, as_completed

from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import numpy as np
from tqdm import tqdm

# Optional BLIP for auto-captioning
try:
    from transformers import BlipProcessor, BlipForConditionalGeneration
    import torch
    BLIP_AVAILABLE = True
except ImportError:
    BLIP_AVAILABLE = False
    print("Warning: transformers not available. Auto-captioning disabled.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatasetPreparator:
    """Advanced dataset preparation for Stable Diffusion training."""
    
    def __init__(
        self,
        input_dir: str,
        output_dir: str,
        resolution: int = 512,
        train_split: float = 0.9,
        enable_augmentation: bool = False,
        auto_caption: bool = False,
        augmentation_multiplier: int = 2,
        quality: int = 95
    ):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.resolution = resolution
        self.train_split = train_split
        self.enable_augmentation = enable_augmentation
        self.auto_caption = auto_caption
        self.augmentation_multiplier = augmentation_multiplier
        self.quality = quality
        
        # Initialize BLIP model for auto-captioning
        self.blip_processor = None
        self.blip_model = None
        if auto_caption and BLIP_AVAILABLE:
            self._init_blip_model()
        
        # Create output directories
        self.train_dir = self.output_dir / "train"
        self.val_dir = self.output_dir / "validation"
        
        for dir_path in [self.train_dir, self.val_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            (dir_path / "images").mkdir(exist_ok=True)
            (dir_path / "captions").mkdir(exist_ok=True)
    
    def _init_blip_model(self):
        """Initialize BLIP model for automatic caption generation."""
        try:
            logger.info("Loading BLIP model for auto-captioning...")
            self.blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            self.blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
            
            # Move to GPU if available
            if torch.cuda.is_available():
                self.blip_model = self.blip_model.cuda()
                logger.info("BLIP model loaded on GPU")
            else:
                logger.info("BLIP model loaded on CPU")
        except Exception as e:
            logger.error(f"Failed to load BLIP model: {e}")
            self.auto_caption = False
    
    def get_image_files(self) -> List[Path]:
        """Get all image files from input directory recursively."""
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp', '.gif'}
        image_files = []
        
        for ext in image_extensions:
            image_files.extend(self.input_dir.rglob(f"*{ext}"))
            image_files.extend(self.input_dir.rglob(f"*{ext.upper()}"))
        
        return sorted(image_files)
    
    def resize_image(self, image_path: Path) -> Optional[Image.Image]:
        """Resize image to target resolution with smart cropping."""
        try:
            image = Image.open(image_path).convert('RGB')
            
            # Skip very small images
            if min(image.size) < self.resolution // 2:
                logger.warning(f"Skipping small image: {image_path}")
                return None
            
            # Calculate new size maintaining aspect ratio
            width, height = image.size
            aspect_ratio = width / height
            
            if aspect_ratio > 1:  # Landscape
                new_width = self.resolution
                new_height = int(self.resolution / aspect_ratio)
            else:  # Portrait or square
                new_height = self.resolution
                new_width = int(self.resolution * aspect_ratio)
            
            # Resize with high-quality resampling
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Smart center crop to exact resolution
            image = ImageOps.fit(image, (self.resolution, self.resolution), 
                               Image.Resampling.LANCZOS, centering=(0.5, 0.5))
            
            return image
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return None
    
    def generate_caption_with_blip(self, image: Image.Image) -> str:
        """Generate caption using BLIP model."""
        if not self.auto_caption or not self.blip_model:
            return ""
        
        try:
            inputs = self.blip_processor(image, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            with torch.no_grad():
                out = self.blip_model.generate(**inputs, max_length=50, num_beams=5)
            
            caption = self.blip_processor.decode(out[0], skip_special_tokens=True)
            return caption.strip()
            
        except Exception as e:
            logger.error(f"Error generating caption with BLIP: {e}")
            return ""
    
    def get_caption(self, image_path: Path, image: Optional[Image.Image] = None) -> str:
        """Get caption for image from file, BLIP, or generate default."""
        # Look for caption file with same name
        caption_path = image_path.with_suffix('.txt')
        
        if caption_path.exists():
            try:
                with open(caption_path, 'r', encoding='utf-8') as f:
                    caption = f.read().strip()
                    if caption:
                        return caption
            except Exception as e:
                logger.warning(f"Error reading caption file {caption_path}: {str(e)}")
        
        # Try BLIP auto-captioning
        if self.auto_caption and image:
            blip_caption = self.generate_caption_with_blip(image)
            if blip_caption:
                return blip_caption
        
        # Generate default caption from filename and path
        filename = image_path.stem.replace('_', ' ').replace('-', ' ')
        parent_dir = image_path.parent.name
        
        if parent_dir != self.input_dir.name:
            return f"A {parent_dir} style image of {filename}"
        else:
            return f"A photo of {filename}"
    
    def augment_image(self, image: Image.Image) -> List[Image.Image]:
        """Apply advanced data augmentation to image."""
        if not self.enable_augmentation:
            return [image]
        
        augmented_images = [image]  # Original image
        
        for _ in range(self.augmentation_multiplier - 1):
            aug_image = image.copy()
            
            # Random horizontal flip (50% chance)
            if random.random() > 0.5:
                aug_image = aug_image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            
            # Random rotation (-10 to 10 degrees)
            if random.random() > 0.7:
                angle = random.uniform(-10, 10)
                aug_image = aug_image.rotate(angle, expand=False, fillcolor=(255, 255, 255))
            
            # Random brightness (0.8 to 1.2)
            if random.random() > 0.6:
                enhancer = ImageEnhance.Brightness(aug_image)
                factor = random.uniform(0.8, 1.2)
                aug_image = enhancer.enhance(factor)
            
            # Random contrast (0.8 to 1.2)
            if random.random() > 0.6:
                enhancer = ImageEnhance.Contrast(aug_image)
                factor = random.uniform(0.8, 1.2)
                aug_image = enhancer.enhance(factor)
            
            # Random saturation (0.8 to 1.2)
            if random.random() > 0.7:
                enhancer = ImageEnhance.Color(aug_image)
                factor = random.uniform(0.8, 1.2)
                aug_image = enhancer.enhance(factor)
            
            # Random blur (very subtle)
            if random.random() > 0.9:
                aug_image = aug_image.filter(ImageFilter.GaussianBlur(radius=0.5))
            
            augmented_images.append(aug_image)
        
        return augmented_images
    
    def process_image(self, image_path: Path, output_dir: Path, index: int) -> int:
        """Process a single image and return number of processed images."""
        # Resize image
        processed_image = self.resize_image(image_path)
        if processed_image is None:
            return 0
        
        # Get caption
        caption = self.get_caption(image_path, processed_image)
        
        # Apply augmentation if enabled
        augmented_images = self.augment_image(processed_image)
        
        processed_count = 0
        
        # Save all versions
        for j, aug_image in enumerate(augmented_images):
            if j == 0:
                # Original image
                output_name = f"{index:06d}_{image_path.stem}"
            else:
                # Augmented image
                output_name = f"{index:06d}_{image_path.stem}_aug_{j}"
            
            # Save image
            image_output_path = output_dir / "images" / f"{output_name}.jpg"
            aug_image.save(image_output_path, "JPEG", quality=self.quality, optimize=True)
            
            # Save caption
            caption_output_path = output_dir / "captions" / f"{output_name}.txt"
            with open(caption_output_path, 'w', encoding='utf-8') as f:
                f.write(caption)
            
            processed_count += 1
        
        return processed_count

    def process_dataset(self):
        """Process the entire dataset with parallel processing."""
        logger.info(f"Starting advanced dataset preparation...")
        logger.info(f"Input directory: {self.input_dir}")
        logger.info(f"Output directory: {self.output_dir}")
        logger.info(f"Target resolution: {self.resolution}x{self.resolution}")
        logger.info(f"Train/validation split: {self.train_split:.1%}/{1-self.train_split:.1%}")
        logger.info(f"Augmentation: {'Enabled' if self.enable_augmentation else 'Disabled'}")
        logger.info(f"Auto-captioning: {'Enabled' if self.auto_caption else 'Disabled'}")

        image_files = self.get_image_files()
        if not image_files:
            logger.error("No image files found in input directory!")
            return

        logger.info(f"Found {len(image_files)} images to process")

        # Shuffle for better train/val distribution
        random.shuffle(image_files)

        # Split into train/validation
        split_idx = int(len(image_files) * self.train_split)
        train_files = image_files[:split_idx]
        val_files = image_files[split_idx:]

        # Process training set
        train_count = self._process_split(train_files, self.train_dir, "training")

        # Process validation set
        val_count = self._process_split(val_files, self.val_dir, "validation")

        # Save dataset metadata
        self._save_metadata(train_count, val_count)

        logger.info("Dataset preparation completed successfully!")
        logger.info(f"Total processed images: {train_count + val_count}")

    def _process_split(self, image_files: List[Path], output_dir: Path, split_name: str) -> int:
        """Process a split of the dataset with parallel processing."""
        logger.info(f"Processing {split_name} set ({len(image_files)} images)...")

        total_processed = 0

        # Use ThreadPoolExecutor for I/O bound operations
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = []

            for i, image_path in enumerate(image_files):
                future = executor.submit(self.process_image, image_path, output_dir, i)
                futures.append(future)

            # Process results with progress bar
            for future in tqdm(as_completed(futures), total=len(futures), desc=f"Processing {split_name}"):
                try:
                    processed_count = future.result()
                    total_processed += processed_count
                except Exception as e:
                    logger.error(f"Error processing image: {e}")

        logger.info(f"Processed {total_processed} images for {split_name} set")
        return total_processed

    def _save_metadata(self, train_count: int, val_count: int):
        """Save comprehensive dataset metadata."""
        metadata = {
            "dataset_info": {
                "total_images": train_count + val_count,
                "train_images": train_count,
                "validation_images": val_count,
                "resolution": f"{self.resolution}x{self.resolution}",
                "augmentation_enabled": self.enable_augmentation,
                "augmentation_multiplier": self.augmentation_multiplier if self.enable_augmentation else 1,
                "auto_caption_enabled": self.auto_caption,
                "train_split": self.train_split,
                "image_quality": self.quality
            },
            "directories": {
                "train_images": str(self.train_dir / "images"),
                "train_captions": str(self.train_dir / "captions"),
                "validation_images": str(self.val_dir / "images"),
                "validation_captions": str(self.val_dir / "captions")
            },
            "processing_config": {
                "input_directory": str(self.input_dir),
                "output_directory": str(self.output_dir),
                "target_resolution": self.resolution,
                "train_validation_split": self.train_split,
                "augmentation_settings": {
                    "enabled": self.enable_augmentation,
                    "multiplier": self.augmentation_multiplier,
                    "techniques": [
                        "horizontal_flip",
                        "rotation",
                        "brightness_adjustment",
                        "contrast_adjustment",
                        "saturation_adjustment",
                        "gaussian_blur"
                    ] if self.enable_augmentation else []
                }
            }
        }

        metadata_path = self.output_dir / "dataset_metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Dataset metadata saved to {metadata_path}")

def main():
    parser = argparse.ArgumentParser(description="Advanced dataset preparation for LexiGraph training")
    parser.add_argument("--input_dir", required=True, help="Input directory containing images")
    parser.add_argument("--output_dir", required=True, help="Output directory for processed dataset")
    parser.add_argument("--resolution", type=int, default=512,
                       help="Target image resolution (default: 512)")
    parser.add_argument("--train_split", type=float, default=0.9,
                       help="Training split ratio (default: 0.9)")
    parser.add_argument("--augment", action="store_true",
                       help="Enable data augmentation")
    parser.add_argument("--augment_multiplier", type=int, default=2,
                       help="Number of augmented versions per image (default: 2)")
    parser.add_argument("--auto_caption", action="store_true",
                       help="Enable automatic caption generation using BLIP")
    parser.add_argument("--quality", type=int, default=95,
                       help="JPEG quality for output images (default: 95)")

    args = parser.parse_args()

    # Validate arguments
    if not os.path.exists(args.input_dir):
        logger.error(f"Input directory does not exist: {args.input_dir}")
        return

    if args.train_split <= 0 or args.train_split >= 1:
        logger.error("Train split must be between 0 and 1")
        return

    if args.resolution <= 0 or args.resolution % 8 != 0:
        logger.error("Resolution must be positive and divisible by 8")
        return

    if args.auto_caption and not BLIP_AVAILABLE:
        logger.error("Auto-captioning requires transformers and torch. Install with: pip install transformers torch")
        return

    # Create dataset preparator and process
    preparator = DatasetPreparator(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        resolution=args.resolution,
        train_split=args.train_split,
        enable_augmentation=args.augment,
        auto_caption=args.auto_caption,
        augmentation_multiplier=args.augment_multiplier,
        quality=args.quality
    )

    preparator.process_dataset()

if __name__ == "__main__":
    main()
