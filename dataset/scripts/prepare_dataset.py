#!/usr/bin/env python3
"""
Dataset Preparation Script for Lexigraph Text-to-Image Training

This script prepares image-caption pairs for DreamBooth/LoRA training by:
1. Loading images from input directory
2. Resizing images to 512x512 pixels
3. Creating corresponding caption text files
4. Organizing data for training pipeline

Usage:
    python prepare_dataset.py --input_dir ../raw --output_dir ../processed
    python prepare_dataset.py --input_dir ../raw --output_dir ../processed --resolution 768
"""

import os
import argparse
import json
import logging
from pathlib import Path
from typing import List, Tuple, Optional
from PIL import Image, ImageOps
import shutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('dataset_preparation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DatasetPreparer:
    """Handles dataset preparation for text-to-image training."""
    
    def __init__(self, input_dir: str, output_dir: str, resolution: int = 512):
        """
        Initialize the dataset preparer.
        
        Args:
            input_dir: Directory containing raw images and captions
            output_dir: Directory to save processed dataset
            resolution: Target image resolution (default: 512)
        """
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.resolution = resolution
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'}
        
        # Create output directories
        self.images_dir = self.output_dir / 'images'
        self.captions_dir = self.output_dir / 'captions'
        self.metadata_file = self.output_dir / 'metadata.json'
        
        self._create_directories()
    
    def _create_directories(self):
        """Create necessary output directories."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(exist_ok=True)
        self.captions_dir.mkdir(exist_ok=True)
        logger.info(f"Created output directories in {self.output_dir}")
    
    def _get_image_files(self) -> List[Path]:
        """Get all supported image files from input directory."""
        image_files = []
        for ext in self.supported_formats:
            image_files.extend(self.input_dir.glob(f'*{ext}'))
            image_files.extend(self.input_dir.glob(f'*{ext.upper()}'))
        
        logger.info(f"Found {len(image_files)} image files")
        return sorted(image_files)
    
    def _resize_image(self, image_path: Path, output_path: Path) -> bool:
        """
        Resize image to target resolution while maintaining aspect ratio.
        
        Args:
            image_path: Path to input image
            output_path: Path to save resized image
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize with padding to maintain aspect ratio
                img = ImageOps.fit(
                    img, 
                    (self.resolution, self.resolution), 
                    Image.Resampling.LANCZOS,
                    centering=(0.5, 0.5)
                )
                
                # Save with high quality
                img.save(output_path, 'JPEG', quality=95, optimize=True)
                return True
                
        except Exception as e:
            logger.error(f"Error processing {image_path}: {str(e)}")
            return False
    
    def _find_caption_file(self, image_path: Path) -> Optional[Path]:
        """
        Find corresponding caption file for an image.
        
        Looks for:
        1. Same name with .txt extension
        2. Same name with .caption extension
        3. captions.json file with image mappings
        
        Args:
            image_path: Path to image file
            
        Returns:
            Path to caption file or None if not found
        """
        # Try .txt file with same name
        txt_file = image_path.with_suffix('.txt')
        if txt_file.exists():
            return txt_file
        
        # Try .caption file with same name
        caption_file = image_path.with_suffix('.caption')
        if caption_file.exists():
            return caption_file
        
        # Try captions.json
        captions_json = self.input_dir / 'captions.json'
        if captions_json.exists():
            try:
                with open(captions_json, 'r', encoding='utf-8') as f:
                    captions_data = json.load(f)
                    if image_path.name in captions_data:
                        return captions_json
            except Exception as e:
                logger.warning(f"Error reading captions.json: {str(e)}")
        
        return None
    
    def _read_caption(self, image_path: Path, caption_file: Path) -> str:
        """
        Read caption text for an image.
        
        Args:
            image_path: Path to image file
            caption_file: Path to caption file
            
        Returns:
            Caption text or default caption
        """
        try:
            if caption_file.suffix == '.json':
                # Read from JSON file
                with open(caption_file, 'r', encoding='utf-8') as f:
                    captions_data = json.load(f)
                    return captions_data.get(image_path.name, f"A photo of {image_path.stem}")
            else:
                # Read from text file
                with open(caption_file, 'r', encoding='utf-8') as f:
                    caption = f.read().strip()
                    return caption if caption else f"A photo of {image_path.stem}"
        except Exception as e:
            logger.warning(f"Error reading caption for {image_path}: {str(e)}")
            return f"A photo of {image_path.stem}"
    
    def prepare_dataset(self) -> dict:
        """
        Main method to prepare the dataset.
        
        Returns:
            dict: Statistics about the preparation process
        """
        logger.info("Starting dataset preparation...")
        
        image_files = self._get_image_files()
        if not image_files:
            logger.error("No image files found in input directory")
            return {"success": False, "error": "No images found"}
        
        stats = {
            "total_images": len(image_files),
            "processed_images": 0,
            "failed_images": 0,
            "captions_found": 0,
            "captions_generated": 0
        }
        
        metadata = {
            "dataset_info": {
                "source_dir": str(self.input_dir),
                "output_dir": str(self.output_dir),
                "resolution": self.resolution,
                "total_images": len(image_files)
            },
            "images": []
        }
        
        for i, image_path in enumerate(image_files, 1):
            logger.info(f"Processing {i}/{len(image_files)}: {image_path.name}")
            
            # Generate output filename
            output_filename = f"{i:06d}.jpg"
            output_image_path = self.images_dir / output_filename
            output_caption_path = self.captions_dir / f"{i:06d}.txt"
            
            # Resize image
            if self._resize_image(image_path, output_image_path):
                stats["processed_images"] += 1
                
                # Handle caption
                caption_file = self._find_caption_file(image_path)
                if caption_file:
                    caption = self._read_caption(image_path, caption_file)
                    stats["captions_found"] += 1
                else:
                    caption = f"A photo of {image_path.stem}"
                    stats["captions_generated"] += 1
                
                # Save caption
                with open(output_caption_path, 'w', encoding='utf-8') as f:
                    f.write(caption)
                
                # Add to metadata
                metadata["images"].append({
                    "id": i,
                    "original_filename": image_path.name,
                    "processed_filename": output_filename,
                    "caption": caption,
                    "resolution": f"{self.resolution}x{self.resolution}"
                })
                
            else:
                stats["failed_images"] += 1
        
        # Save metadata
        with open(self.metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info("Dataset preparation completed!")
        logger.info(f"Statistics: {stats}")
        
        return {"success": True, "stats": stats}

def main():
    """Main function to run dataset preparation."""
    parser = argparse.ArgumentParser(description="Prepare dataset for text-to-image training")
    parser.add_argument("--input_dir", required=True, help="Input directory with raw images")
    parser.add_argument("--output_dir", required=True, help="Output directory for processed dataset")
    parser.add_argument("--resolution", type=int, default=512, help="Target image resolution (default: 512)")
    
    args = parser.parse_args()
    
    # Validate input directory
    if not os.path.exists(args.input_dir):
        logger.error(f"Input directory does not exist: {args.input_dir}")
        return
    
    # Initialize and run dataset preparer
    preparer = DatasetPreparer(args.input_dir, args.output_dir, args.resolution)
    result = preparer.prepare_dataset()
    
    if result["success"]:
        logger.info("Dataset preparation completed successfully!")
        print(f"\nProcessed dataset saved to: {args.output_dir}")
        print(f"Images: {result['stats']['processed_images']}")
        print(f"Failed: {result['stats']['failed_images']}")
        print(f"Captions found: {result['stats']['captions_found']}")
        print(f"Captions generated: {result['stats']['captions_generated']}")
    else:
        logger.error(f"Dataset preparation failed: {result.get('error', 'Unknown error')}")

if __name__ == "__main__":
    main()
