# Lexigraph - Custom Text-to-Image Generation Platform

A complete end-to-end text-to-image generation application using custom-trained Stable Diffusion models with DreamBooth/LoRA fine-tuning.

## 🚀 Project Overview

Lexigraph enables you to:
- Train custom Stable Diffusion models using your own datasets
- Deploy a production-ready FastAPI backend for image generation
- Provide a modern React.js frontend with Tailwind CSS
- Deploy to cloud platforms (Hugging Face Spaces, Render, Vercel)

## 📁 Project Structure

```
Lexigraph/
├── dataset/                    # Dataset preparation and storage
│   ├── raw/                   # Raw images and captions
│   ├── processed/             # Processed 512x512 images
│   ├── scripts/               # Dataset preparation scripts
│   └── examples/              # Example datasets
├── training/                  # Model training components
│   ├── scripts/               # Training scripts (DreamBooth, LoRA)
│   ├── configs/               # Training configurations
│   ├── models/                # Trained model outputs
│   └── logs/                  # Training logs
├── backend/                   # FastAPI backend
│   ├── app/                   # Main application code
│   ├── models/                # Model loading and inference
│   ├── api/                   # API endpoints
│   ├── utils/                 # Utility functions
│   └── tests/                 # Backend tests
├── frontend/                  # React.js frontend
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   └── dist/                  # Build output
├── deployment/                # Deployment configurations
│   ├── huggingface/           # HF Spaces configs
│   ├── render/                # Render deployment
│   └── vercel/                # Vercel deployment
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

## 🛠️ Technology Stack

- **Training**: Hugging Face Diffusers, DreamBooth, LoRA
- **Backend**: FastAPI, PyTorch, Pillow
- **Frontend**: React.js, Tailwind CSS, Axios
- **Deployment**: Hugging Face Spaces, Render, Vercel
- **Storage**: Local filesystem, Hugging Face Hub

## 📋 Prerequisites

- Python 3.8+
- Node.js 16+
- CUDA-compatible GPU (recommended for training)
- Git and Git LFS
- Hugging Face account (for model hosting)

## 🚀 Quick Start

### 1. Dataset Preparation
```bash
cd dataset/scripts
python prepare_dataset.py --input_dir ../raw --output_dir ../processed
```

### 2. Model Training
```bash
cd training/scripts
python train_dreambooth.py --config ../configs/dreambooth_config.yaml
```

### 3. Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 Detailed Documentation

- [Dataset Preparation Guide](docs/dataset-preparation.md)
- [Training Guide](docs/training-guide.md)
- [Backend API Documentation](docs/backend-api.md)
- [Frontend Development](docs/frontend-development.md)
- [Deployment Guide](docs/deployment-guide.md)

## 🔧 Configuration

All configurations are stored in respective config files:
- Training: `training/configs/`
- Backend: `backend/app/config.py`
- Frontend: `frontend/src/config/`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Hugging Face for the Diffusers library
- Stability AI for Stable Diffusion
- The open-source community for various tools and libraries

---

**Note**: This project uses only open-source tools and models. No paid APIs are required.
