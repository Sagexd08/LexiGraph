#!/usr/bin/env python3
"""
Development Setup Script for LexiGraph

Installs dependencies and sets up the development environment.
"""

import subprocess
import sys
import os
from pathlib import Path

def run_command(cmd, cwd=None, check=True):
    """Run a command and return the result."""
    print(f"Running: {cmd}")
    try:
        result = subprocess.run(cmd, shell=True, cwd=cwd, check=check, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return result
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        if check:
            raise
        return e

def setup_backend():
    """Setup backend environment."""
    print("\n🔧 Setting up backend environment...")
    backend_dir = Path("backend")
    
    if not backend_dir.exists():
        print("❌ Backend directory not found!")
        return False
        
    # Install backend dependencies
    print("📦 Installing backend dependencies...")
    result = run_command("pip install -r requirements.txt", cwd=backend_dir, check=False)
    
    if result.returncode != 0:
        print("⚠️  Some backend dependencies failed to install. This is common with GPU packages.")
        print("   You may need to install PyTorch manually for your specific setup.")
        
    # Create .env file if it doesn't exist
    env_file = backend_dir / ".env"
    if not env_file.exists():
        print("📝 Creating .env file...")
        env_content = """# LexiGraph Backend Configuration
DEBUG=true
HOST=0.0.0.0
PORT=8000
MODEL_PATH=../training/models/lora_output
BASE_MODEL=runwayml/stable-diffusion-v1-5
MODEL_TYPE=lora
DEVICE=auto
LOG_LEVEL=INFO
ENABLE_XFORMERS=true
ENABLE_CPU_OFFLOAD=true
ENABLE_ATTENTION_SLICING=true
MAX_CONCURRENT_REQUESTS=3
"""
        env_file.write_text(env_content)
        print("✅ Created .env file")
    
    return True

def setup_frontend():
    """Setup frontend environment."""
    print("\n🔧 Setting up frontend environment...")
    frontend_dir = Path("frontend")
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found!")
        return False
        
    # Install Node.js dependencies
    print("📦 Installing frontend dependencies...")
    result = run_command("npm install", cwd=frontend_dir, check=False)
    
    if result.returncode != 0:
        print("❌ Failed to install frontend dependencies")
        print("   Make sure Node.js and npm are installed")
        return False
        
    print("✅ Frontend dependencies installed")
    return True

def setup_training():
    """Setup training environment."""
    print("\n🔧 Setting up training environment...")
    training_dir = Path("training")
    
    if not training_dir.exists():
        print("❌ Training directory not found!")
        return False
        
    # Install training dependencies
    print("📦 Installing training dependencies...")
    result = run_command("pip install -r requirements.txt", cwd=training_dir, check=False)
    
    if result.returncode != 0:
        print("⚠️  Some training dependencies failed to install.")
        print("   This is common with GPU-specific packages like xformers.")
        
    # Create necessary directories
    models_dir = training_dir / "models"
    logs_dir = training_dir / "logs"
    
    models_dir.mkdir(exist_ok=True)
    logs_dir.mkdir(exist_ok=True)
    
    print("✅ Training directories created")
    return True

def setup_dataset():
    """Setup dataset directories."""
    print("\n🔧 Setting up dataset directories...")
    dataset_dir = Path("dataset")
    
    # Create necessary directories
    dirs_to_create = [
        dataset_dir / "raw",
        dataset_dir / "processed" / "images",
        dataset_dir / "processed" / "captions",
        dataset_dir / "augmented" / "images", 
        dataset_dir / "augmented" / "captions"
    ]
    
    for dir_path in dirs_to_create:
        dir_path.mkdir(parents=True, exist_ok=True)
        
    print("✅ Dataset directories created")
    return True

def main():
    """Main setup function."""
    print("🚀 LexiGraph Development Setup")
    print("=" * 40)
    
    # Check if we're in the right directory
    if not Path("README.md").exists():
        print("❌ Please run this script from the LexiGraph root directory")
        sys.exit(1)
        
    success = True
    
    # Setup each component
    success &= setup_dataset()
    success &= setup_backend() 
    success &= setup_frontend()
    success &= setup_training()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Setup completed successfully!")
        print("\n📋 Next steps:")
        print("1. Add your training images to dataset/raw/")
        print("2. Run dataset preparation: cd dataset/scripts && python prepare_dataset.py")
        print("3. Start backend: cd backend && python -m app.main")
        print("4. Start frontend: cd frontend && npm run dev")
    else:
        print("⚠️  Setup completed with some warnings.")
        print("   Check the output above for any issues.")
        
    print("\n💡 For more information, see the README.md file")

if __name__ == "__main__":
    main()
