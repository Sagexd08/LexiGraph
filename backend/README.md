# LexiGraph Backend

High-performance FastAPI backend for AI image generation with Stable Diffusion.

## 🚀 Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## 🏗️ Architecture

```
app/
├── api/v1/              # API endpoints
│   ├── generate.py      # Image generation
│   ├── system.py        # System monitoring
│   └── styles.py        # Style management
├── models/              # AI model handlers
│   ├── diffusion.py     # Stable Diffusion
│   ├── lora.py          # LoRA models
│   └── cache.py         # Smart caching
├── utils/               # Utilities
├── config.py            # Configuration
└── main.py              # FastAPI app
```

## 📖 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/generate` | POST | Generate images |
| `/api/v1/styles` | GET | Style presets |
| `/api/v1/system/info` | GET | System metrics |
| `/api/v1/health` | GET | Health check |

**Documentation**: http://localhost:8000/docs

## ⚙️ Configuration

Key environment variables:

```env
MODEL_PATH=./models/lexigraph
DEVICE=cuda
API_KEY=your-secret-key
MAX_CONCURRENT_REQUESTS=3
ENABLE_CACHING=true
```

## 🚀 Deployment

```bash
# Docker
docker build -t lexigraph-backend .
docker run -p 8000:8000 --gpus all lexigraph-backend

# Production
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🧪 Testing

```bash
pytest tests/ -v --cov=app
```

