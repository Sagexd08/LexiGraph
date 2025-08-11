import os
import argparse
import json
import logging
from pathlib import Path
from typing import Dict, List, Tuple
from PIL import Image

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatasetValidator:
    """Validates prepared datasets for training readiness."""
    
    def __init__(self, dataset_dir: str):
        """
        Initialize the dataset validator.
        
        Args:
            dataset_dir: Directory containing processed dataset
        """
        self.dataset_dir = Path(dataset_dir)
        self.images_dir = self.dataset_dir / 'images'
        self.captions_dir = self.dataset_dir / 'captions'
        self.metadata_file = self.dataset_dir / 'metadata.json'
        
        self.validation_results = {
            "directory_structure": False,
            "metadata_exists": False,
            "image_caption_pairs": 0,
            "missing_captions": 0,
            "corrupted_images": 0,
            "resolution_issues": 0,
            "total_size_mb": 0,
            "issues": []
        }
    
    def validate_directory_structure(self) -> bool:
        """Validate that required directories exist."""
        required_dirs = [self.images_dir, self.captions_dir]
        
        for dir_path in required_dirs:
            if not dir_path.exists():
                self.validation_results["issues"].append(f"Missing directory: {dir_path}")
                return False
        
        self.validation_results["directory_structure"] = True
        logger.info("✓ Directory structure is valid")
        return True
    
    def validate_metadata(self) -> bool:
        """Validate metadata file exists and is properly formatted."""
        if not self.metadata_file.exists():
            self.validation_results["issues"].append("Missing metadata.json file")
            return False
        
        try:
            with open(self.metadata_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            
            required_keys = ["dataset_info", "images"]
            for key in required_keys:
                if key not in metadata:
                    self.validation_results["issues"].append(f"Missing key in metadata: {key}")
                    return False
            
            self.validation_results["metadata_exists"] = True
            logger.info("✓ Metadata file is valid")
            return True
            
        except json.JSONDecodeError as e:
            self.validation_results["issues"].append(f"Invalid JSON in metadata: {str(e)}")
            return False
    
    def validate_image_caption_pairs(self) -> Tuple[int, int]:
        """
        Validate image-caption pairs.
        
        Returns:
            Tuple of (valid_pairs, missing_captions)
        """
        image_files = list(self.images_dir.glob('*.jpg')) + list(self.images_dir.glob('*.jpeg'))
        valid_pairs = 0
        missing_captions = 0
        
        for image_file in image_files:
            caption_file = self.captions_dir / f"{image_file.stem}.txt"
            
            if caption_file.exists():
                try:
                    with open(caption_file, 'r', encoding='utf-8') as f:
                        caption = f.read().strip()
                    
                    if caption:
                        valid_pairs += 1
                    else:
                        missing_captions += 1
                        self.validation_results["issues"].append(f"Empty caption: {caption_file}")
                        
                except Exception as e:
                    missing_captions += 1
                    self.validation_results["issues"].append(f"Error reading caption {caption_file}: {str(e)}")
            else:
                missing_captions += 1
                self.validation_results["issues"].append(f"Missing caption for: {image_file}")
        
        self.validation_results["image_caption_pairs"] = valid_pairs
        self.validation_results["missing_captions"] = missing_captions
        
        logger.info(f"✓ Found {valid_pairs} valid image-caption pairs")
        if missing_captions > 0:
            logger.warning(f"⚠ Found {missing_captions} missing captions")
        
        return valid_pairs, missing_captions
    
    def validate_images(self) -> Tuple[int, int]:
        """
        Validate image files for corruption and resolution.
        
        Returns:
            Tuple of (corrupted_count, resolution_issues_count)
        """
        image_files = list(self.images_dir.glob('*.jpg')) + list(self.images_dir.glob('*.jpeg'))
        corrupted_images = 0
        resolution_issues = 0
        total_size = 0
        
        for image_file in image_files:
            try:
                with Image.open(image_file) as img:
                    # Check if image can be loaded
                    img.verify()
                
                # Reopen for size check (verify() closes the image)
                with Image.open(image_file) as img:
                    width, height = img.size
                    
                    # Check resolution (should be square and common training sizes)
                    if width != height:
                        resolution_issues += 1
                        self.validation_results["issues"].append(f"Non-square image: {image_file} ({width}x{height})")
                    elif width not in [512, 768, 1024]:
                        resolution_issues += 1
                        self.validation_results["issues"].append(f"Unusual resolution: {image_file} ({width}x{height})")
                
                # Calculate file size
                total_size += image_file.stat().st_size
                
            except Exception as e:
                corrupted_images += 1
                self.validation_results["issues"].append(f"Corrupted image: {image_file} - {str(e)}")
        
        self.validation_results["corrupted_images"] = corrupted_images
        self.validation_results["resolution_issues"] = resolution_issues
        self.validation_results["total_size_mb"] = round(total_size / (1024 * 1024), 2)
        
        logger.info(f"✓ Validated {len(image_files)} images")
        if corrupted_images > 0:
            logger.warning(f"⚠ Found {corrupted_images} corrupted images")
        if resolution_issues > 0:
            logger.warning(f"⚠ Found {resolution_issues} resolution issues")
        
        return corrupted_images, resolution_issues
    
    def generate_report(self) -> Dict:
        """Generate a comprehensive validation report."""
        report = {
            "validation_summary": {
                "status": "PASS" if len(self.validation_results["issues"]) == 0 else "FAIL",
                "total_issues": len(self.validation_results["issues"]),
                "dataset_ready": len(self.validation_results["issues"]) == 0 and 
                                self.validation_results["image_caption_pairs"] > 0
            },
            "dataset_stats": {
                "valid_pairs": self.validation_results["image_caption_pairs"],
                "missing_captions": self.validation_results["missing_captions"],
                "corrupted_images": self.validation_results["corrupted_images"],
                "resolution_issues": self.validation_results["resolution_issues"],
                "total_size_mb": self.validation_results["total_size_mb"]
            },
            "issues": self.validation_results["issues"]
        }
        
        return report
    
    def run_validation(self) -> Dict:
        """Run complete dataset validation."""
        logger.info(f"Starting validation of dataset: {self.dataset_dir}")
        
        # Run all validation checks
        self.validate_directory_structure()
        self.validate_metadata()
        self.validate_image_caption_pairs()
        self.validate_images()
        
        # Generate and return report
        report = self.generate_report()
        
        # Log summary
        if report["validation_summary"]["dataset_ready"]:
            logger.info("✅ Dataset validation PASSED - Ready for training!")
        else:
            logger.error("❌ Dataset validation FAILED - Issues need to be resolved")
            logger.error(f"Total issues found: {report['validation_summary']['total_issues']}")
        
        return report

def main():
    """Main function to run dataset validation."""
    parser = argparse.ArgumentParser(description="Validate prepared dataset for training")
    parser.add_argument("--dataset_dir", required=True, help="Directory containing processed dataset")
    parser.add_argument("--output_report", help="Save validation report to JSON file")
    
    args = parser.parse_args()
    
    # Validate dataset directory
    if not os.path.exists(args.dataset_dir):
        logger.error(f"Dataset directory does not exist: {args.dataset_dir}")
        return
    
    # Run validation
    validator = DatasetValidator(args.dataset_dir)
    report = validator.run_validation()
    
    # Print summary
    print("\n" + "="*50)
    print("DATASET VALIDATION REPORT")
    print("="*50)
    print(f"Status: {report['validation_summary']['status']}")
    print(f"Dataset Ready: {report['validation_summary']['dataset_ready']}")
    print(f"Total Issues: {report['validation_summary']['total_issues']}")
    print(f"Valid Pairs: {report['dataset_stats']['valid_pairs']}")
    print(f"Dataset Size: {report['dataset_stats']['total_size_mb']} MB")
    
    if report["issues"]:
        print("\nISSUES FOUND:")
        for i, issue in enumerate(report["issues"], 1):
            print(f"{i}. {issue}")
    
    # Save report if requested
    if args.output_report:
        with open(args.output_report, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"\nDetailed report saved to: {args.output_report}")

if __name__ == "__main__":
    main()
