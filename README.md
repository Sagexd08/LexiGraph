## Lexigraph - Custom Text-to-Image Generation Platform

A complete production-ready, end-to-end text-to-image generation application using custom-trained Stable Diffusion models with DreamBooth/LoRA fine-tuning.

### Features
- Dataset preparation and validation scripts
- DreamBooth and LoRA training pipelines (Diffusers + Accelerate)
- Push trained models to Hugging Face Hub
- FastAPI backend with model management, logging, GPU/CPU toggles
- React + Vite + Tailwind frontend with advanced UX
- Dockerized deployment (GPU-ready) + Hugging Face Spaces app

### Repository Structure
- dataset/ — preparation, validation, augmentation
- training/ — configs and training scripts (DreamBooth/LoRA) + push_to_hub
- backend/ — FastAPI app (image generation API)
- frontend/ — React app (Vite/Tailwind)
- deployment/ — Docker, docker-compose, nginx, and HF Spaces app

### Quickstart
1) Dataset
- Put raw images + optional captions in dataset/raw/
- Prepare dataset:
  python dataset/scripts/prepare_dataset.py --input_dir dataset/raw --output_dir dataset/processed --resolution 512
- Validate: python dataset/scripts/validate_dataset.py --dataset_dir dataset/processed
- (Optional) Augment: python dataset/scripts/augment_dataset.py --input_dir dataset/processed --output_dir dataset/augmented --multiplier 2

2) Training
- Install: pip install -r training/requirements.txt
- Configure DreamBooth: training/configs/dreambooth_config.yaml
- Run: python training/scripts/train_dreambooth.py --config training/configs/dreambooth_config.yaml
- Or LoRA: python training/scripts/train_lora.py --config training/configs/lora_config.yaml
- Push to Hub: python training/scripts/push_to_hub.py --model_dir training/models/<output_dir> --repo_id <user/repo>

3) Backend
- cp backend/.env.example backend/.env and set variables
- pip install -r backend/requirements.txt
- uvicorn app.main:app --reload --port 8000 (from backend/)
- Endpoints: /api/v1/generate, /api/v1/model/info, /api/v1/system/info, /api/v1/health

4) Frontend
- cd frontend && npm install
- npm run dev (Vite on http://localhost:3000)
- Configure API proxy in vite.config.ts if needed

5) Docker
- docker compose -f deployment/docker-compose.yml up --build -d
- Backend on :8000, Frontend on :3000

6) Hugging Face Spaces
- Use deployment/huggingface/app.py
- Set HF token + model path in environment

### Notes
- Only open-source models/tools used (Stable Diffusion via Diffusers)
- No paid APIs required
- Tailwind requires proper PostCSS config in Vite project

### Tests
- Add tests under backend/app/tests/ and use pytest
- For dataset: create unit tests for prepare/validate scripts

### License
MIT
