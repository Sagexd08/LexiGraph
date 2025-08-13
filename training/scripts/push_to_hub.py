#!/usr/bin/env python3
"""
Push Trained Model to Hugging Face Hub

This script uploads a locally trained model (DreamBooth or LoRA) to the Hugging Face Hub.

Usage:
    python push_to_hub.py --model_dir ./models/dreambooth_output --repo_id username/lexigraph-model --private
"""

import argparse
import os
from huggingface_hub import HfApi, create_repo, upload_folder


def push_to_hub(model_dir: str, repo_id: str, private: bool = False, token: str | None = None):
    """Push a trained model folder to Hugging Face Hub."""
    api = HfApi(token=token)
    
    # Create repo if it doesn't exist
    create_repo(repo_id=repo_id, token=token, private=private, exist_ok=True)
    
    # Upload folder
    upload_folder(
        repo_id=repo_id,
        folder_path=model_dir,
        commit_message="Upload trained model from Lexigraph",
        ignore_patterns=["*.log", "*.tmp", "*.pt", "*.pth", "__pycache__"]
    )
    
    print(f"Model uploaded successfully to https://huggingface.co/{repo_id}")


def main():
    parser = argparse.ArgumentParser(description="Push trained model to Hugging Face Hub")
    parser.add_argument("--model_dir", required=True, help="Path to trained model directory")
    parser.add_argument("--repo_id", required=True, help="Hugging Face repository ID (e.g., username/model-name)")
    parser.add_argument("--private", action="store_true", help="Create a private repository")
    parser.add_argument("--token", help="Hugging Face token (or use HF_TOKEN env var)")
    
    args = parser.parse_args()
    token = args.token or os.getenv("HF_TOKEN")
    
    push_to_hub(args.model_dir, args.repo_id, args.private, token)


if __name__ == "__main__":
    main()
