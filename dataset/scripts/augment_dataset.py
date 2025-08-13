import os
import argparse
import json
import logging
import random
from pathlib import Path
from typing import List, Tuple, Dict
from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dataset_augmentation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatasetAugmenter:
    """Handles dataset augmentation for improved training diversity."""
    
    def __init__(self, input_dir: str, output_dir: str, multiplier: int = 2):
      
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.multiplier = multiplier
        
        self.input_images_dir = self.input_dir / 'images'
        self.input_captions_dir = self.input_dir / 'captions'
        
        self.output_images_dir = self.output_dir / 'images'
        self.output_captions_dir = self.output_dir / 'captions'
        
        self._create_directories()
        
        self.augmentation_config = {
            'brightness_range': (0.8, 1.2),
            'contrast_range': (0.8, 1.2),
            'saturation_range': (0.8, 1.2),
            'hue_shift_range': (-10, 10),
            'blur_probability': 0.1,
            'noise_probability': 0.1,
            'flip_probability': 0.5
        }
    
    def _create_directories(self):
        """Create necessary output directories."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.output_images_dir.mkdir(exist_ok=True)
        self.output_captions_dir.mkdir(exist_ok=True)
        logger.info(f"Created output directories in {self.output_dir}")
    
    def _apply_brightness_adjustment(self, image: Image.Image) -> Image.Image:
        """Apply random brightness adjustment."""
        factor = random.uniform(*self.augmentation_config['brightness_range'])
        enhancer = ImageEnhance.Brightness(image)
        return enhancer.enhance(factor)
    
    def _apply_contrast_adjustment(self, image: Image.Image) -> Image.Image:
        """Apply random contrast adjustment."""
        factor = random.uniform(*self.augmentation_config['contrast_range'])
        enhancer = ImageEnhance.Contrast(image)
        return enhancer.enhance(factor)
    
    def _apply_saturation_adjustment(self, image: Image.Image) -> Image.Image:
        """Apply random saturation adjustment."""
        factor = random.uniform(*self.augmentation_config['saturation_range'])
        enhancer = ImageEnhance.Color(image)
        return enhancer.enhance(factor)
    
    def _apply_blur(self, image: Image.Image) -> Image.Image:
        """Apply slight blur effect."""
        if random.random() < self.augmentation_config['blur_probability']:
            return image.filter(ImageFilter.GaussianBlur(radius=0.5))
        return image
    
    def _apply_noise(self, image: Image.Image) -> Image.Image:
        """Apply subtle noise to the image."""
        if random.random() < self.augmentation_config['noise_probability']:
            np_image = np.array(image)
            noise = np.random.normal(0, 5, np_image.shape).astype(np.uint8)
            noisy_image = np.clip(np_image.astype(np.int16) + noise, 0, 255).astype(np.uint8)
            return Image.fromarray(noisy_image)
        return image
    
    def _apply_horizontal_flip(self, image: Image.Image) -> Tuple[Image.Image, bool]:
        """Apply horizontal flip with probability."""
        if random.random() < self.augmentation_config['flip_probability']:
            return image.transpose(Image.FLIP_LEFT_RIGHT), True
        return image, False
    
    def _augment_image(self, image: Image.Image) -> Tuple[Image.Image, List[str]]:
        """
        Apply random augmentations to an image.
        
        Args:
            image: Input PIL Image
            
        Returns:
            Tuple of (augmented_image, list_of_applied_transformations)
        """
        augmented = image.copy()
        transformations = []
        
        augmented = self._apply_brightness_adjustment(augmented)
        transformations.append("brightness")
        
        augmented = self._apply_contrast_adjustment(augmented)
        transformations.append("contrast")
        
        augmented = self._apply_saturation_adjustment(augmented)
        transformations.append("saturation")
        
        augmented, flipped = self._apply_horizontal_flip(augmented)
        if flipped:
            transformations.append("horizontal_flip")
        
        augmented = self._apply_blur(augmented)
        augmented = self._apply_noise(augmented)
        
        return augmented, transformations
    
    def _modify_caption_for_augmentation(self, original_caption: str, transformations: List[str]) -> str:
        """
        Modify caption based on applied transformations.
        
        Args:
            original_caption: Original image caption
            transformations: List of applied transformations
            
        Returns:
            Modified caption if necessary
        """
        caption = original_caption
        
        if "horizontal_flip" in transformations:
            pass
        
        return caption
    
    def augment_dataset(self) -> Dict:
        """
        Main method to augment the dataset.
        
        Returns:
            dict: Statistics about the augmentation process
        """
        logger.info("Starting dataset augmentation...")
        
        metadata_file = self.input_dir / 'metadata.json'
        if not metadata_file.exists():
            logger.error("Original metadata.json not found")
            return {"success": False, "error": "Missing metadata"}
        
        with open(metadata_file, 'r', encoding='utf-8') as f:
            original_metadata = json.load(f)
        
        # Get all image files
        image_files = list(self.input_images_dir.glob('*.jpg')) + list(self.input_images_dir.glob('*.jpeg'))
        
        if not image_files:
            logger.error("No image files found in input directory")
            return {"success": False, "error": "No images found"}
        
        stats = {
            "original_images": len(image_files),
            "augmented_images": 0,
            "total_images": 0,
            "failed_augmentations": 0
        }
        
        new_metadata = {
            "dataset_info": {
                "source_dir": str(self.input_dir),
                "output_dir": str(self.output_dir),
                "augmentation_multiplier": self.multiplier,
                "original_images": len(image_files),
                "augmentation_config": self.augmentation_config
            },
            "images": []
        }
        
        image_counter = 1
        
        # Copy original images first
        for image_file in image_files:
            try:
                # Copy original image
                output_filename = f"{image_counter:06d}.jpg"
                output_image_path = self.output_images_dir / output_filename
                output_caption_path = self.output_captions_dir / f"{image_counter:06d}.txt"
                
                # Copy image
                with Image.open(image_file) as img:
                    img.save(output_image_path, 'JPEG', quality=95, optimize=True)
                
                # Copy caption
                caption_file = self.input_captions_dir / f"{image_file.stem}.txt"
                if caption_file.exists():
                    with open(caption_file, 'r', encoding='utf-8') as f:
                        caption = f.read().strip()
                    
                    with open(output_caption_path, 'w', encoding='utf-8') as f:
                        f.write(caption)
                    
                    # Add to metadata
                    new_metadata["images"].append({
                        "id": image_counter,
                        "original_filename": image_file.name,
                        "processed_filename": output_filename,
                        "caption": caption,
                        "is_augmented": False,
                        "transformations": []
                    })
                    
                    image_counter += 1
                    stats["total_images"] += 1
                
            except Exception as e:
                logger.error(f"Error copying original image {image_file}: {str(e)}")
                stats["failed_augmentations"] += 1
        
        # Generate augmented versions
        for image_file in image_files:
            try:
                caption_file = self.input_captions_dir / f"{image_file.stem}.txt"
                if not caption_file.exists():
                    continue
                
                with open(caption_file, 'r', encoding='utf-8') as f:
                    original_caption = f.read().strip()
                
                # Create multiple augmented versions
                for aug_idx in range(self.multiplier):
                    with Image.open(image_file) as img:
                        augmented_img, transformations = self._augment_image(img)
                        
                        # Save augmented image
                        output_filename = f"{image_counter:06d}.jpg"
                        output_image_path = self.output_images_dir / output_filename
                        output_caption_path = self.output_captions_dir / f"{image_counter:06d}.txt"
                        
                        augmented_img.save(output_image_path, 'JPEG', quality=95, optimize=True)
                        
                        # Modify caption if necessary
                        modified_caption = self._modify_caption_for_augmentation(original_caption, transformations)
                        
                        with open(output_caption_path, 'w', encoding='utf-8') as f:
                            f.write(modified_caption)
                        
                        # Add to metadata
                        new_metadata["images"].append({
                            "id": image_counter,
                            "original_filename": image_file.name,
                            "processed_filename": output_filename,
                            "caption": modified_caption,
                            "is_augmented": True,
                            "transformations": transformations,
                            "augmentation_index": aug_idx + 1
                        })
                        
                        image_counter += 1
                        stats["augmented_images"] += 1
                        stats["total_images"] += 1
                
                logger.info(f"Augmented {image_file.name} -> {self.multiplier} versions")
                
            except Exception as e:
                logger.error(f"Error augmenting image {image_file}: {str(e)}")
                stats["failed_augmentations"] += 1
        
        # Save new metadata
        metadata_output_file = self.output_dir / 'metadata.json'
        with open(metadata_output_file, 'w', encoding='utf-8') as f:
            json.dump(new_metadata, f, indent=2, ensure_ascii=False)
        
        logger.info("Dataset augmentation completed!")
        logger.info(f"Statistics: {stats}")
        
        return {"success": True, "stats": stats}

def main():
    """Main function to run dataset augmentation."""
    parser = argparse.ArgumentParser(description="Augment dataset for improved training diversity")
    parser.add_argument("--input_dir", required=True, help="Input directory with processed dataset")
    parser.add_argument("--output_dir", required=True, help="Output directory for augmented dataset")
    parser.add_argument("--multiplier", type=int, default=2, help="Augmentation multiplier (default: 2)")
    parser.add_argument("--seed", type=int, help="Random seed for reproducible augmentation")
    
    args = parser.parse_args()
    
    # Set random seed if provided
    if args.seed:
        random.seed(args.seed)
        np.random.seed(args.seed)
        logger.info(f"Set random seed to {args.seed}")
    
    # Validate input directory
    if not os.path.exists(args.input_dir):
        logger.error(f"Input directory does not exist: {args.input_dir}")
        return
    
    # Initialize and run dataset augmenter
    augmenter = DatasetAugmenter(args.input_dir, args.output_dir, args.multiplier)
    result = augmenter.augment_dataset()
    
    if result["success"]:
        logger.info("Dataset augmentation completed successfully!")
        print(f"\nAugmented dataset saved to: {args.output_dir}")
        print(f"Original images: {result['stats']['original_images']}")
        print(f"Augmented images: {result['stats']['augmented_images']}")
        print(f"Total images: {result['stats']['total_images']}")
        print(f"Failed augmentations: {result['stats']['failed_augmentations']}")
    else:
        logger.error(f"Dataset augmentation failed: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()
