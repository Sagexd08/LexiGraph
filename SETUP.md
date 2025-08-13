# Python Environment Setup Guide

This guide will help you set up the proper Python environment for LexiGraph development.

## Quick Setup

Run the automated setup script:
```bash
python setup_dev.py
```

## Manual Setup

### 1. Python Environment
```bash
# Create virtual environment
python -m venv lexigraph-env

# Activate environment (Windows)
lexigraph-env\Scripts\activate

# Activate environment (Linux/Mac)
source lexigraph-env/bin/activate
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Training Dependencies
```bash
cd training
pip install -r requirements.txt
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. GPU Support (Optional)

For NVIDIA GPU support, install PyTorch with CUDA:
```bash
# For CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# For CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 4. Configuration

Copy the example environment files:
```bash
cp backend/.env.example backend/.env
```

Edit the `.env` file to match your setup.

## Troubleshooting

### Common Issues

1. **xformers installation fails**
   - This is normal on Windows or with Python 3.13
   - The application will work without xformers, just with slightly higher memory usage

2. **bitsandbytes installation fails**
   - Windows users may need to install the Windows-specific version
   - Or disable 8-bit optimization in the config

3. **CUDA out of memory**
   - Reduce batch size in training configs
   - Enable CPU offloading in backend config
   - Use smaller model resolutions

4. **Import errors**
   - Make sure you've activated the virtual environment
   - Install all requirements files
   - Check Python version (3.8+ required)

### VS Code Setup

Install these VS Code extensions:
- Python
- Pylance 
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

The `.vscode/settings.json` file is configured to handle Tailwind CSS properly.

## Verification

Test your setup:

```bash
# Test backend
cd backend
python -c "import torch, diffusers, transformers; print('Backend dependencies OK')"

# Test training
cd training  
python -c "import torch, diffusers, accelerate; print('Training dependencies OK')"

# Test frontend
cd frontend
npm run build
```
