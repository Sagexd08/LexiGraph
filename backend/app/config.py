"""
Configuration settings for Lexigraph Backend

Handles environment variables, model paths, and application settings.
"""

import os
from typing import Optional, List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application Settings
    app_name: str = "Lexigraph API"
    app_version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    
    # Model Settings
    model_path: str = Field(default="runwayml/stable-diffusion-v1-5", env="MODEL_PATH")
    base_model: str = Field(default="runwayml/stable-diffusion-v1-5", env="BASE_MODEL")
    model_type: str = Field(default="base", env="MODEL_TYPE")  # "lora", "dreambooth", "base"
    use_safetensors: bool = Field(default=True, env="USE_SAFETENSORS")
    
    # Generation Settings
    default_width: int = Field(default=512, env="DEFAULT_WIDTH")
    default_height: int = Field(default=512, env="DEFAULT_HEIGHT")
    default_steps: int = Field(default=20, env="DEFAULT_STEPS")
    default_guidance_scale: float = Field(default=7.5, env="DEFAULT_GUIDANCE_SCALE")
    max_width: int = Field(default=1024, env="MAX_WIDTH")
    max_height: int = Field(default=1024, env="MAX_HEIGHT")
    max_steps: int = Field(default=100, env="MAX_STEPS")
    max_guidance_scale: float = Field(default=20.0, env="MAX_GUIDANCE_SCALE")
    lora_scale: float = Field(default=1.0, env="LORA_SCALE")
    
    # Hardware Settings
    device: str = Field(default="auto", env="DEVICE")  # "auto", "cuda", "cpu"
    enable_cpu_offload: bool = Field(default=True, env="ENABLE_CPU_OFFLOAD")
    enable_attention_slicing: bool = Field(default=True, env="ENABLE_ATTENTION_SLICING")
    enable_xformers: bool = Field(default=True, env="ENABLE_XFORMERS")
    torch_dtype: str = Field(default="float16", env="TORCH_DTYPE")  # "float16", "float32"
    
    # Memory Management
    max_memory_gb: Optional[float] = Field(default=None, env="MAX_MEMORY_GB")
    clear_cache_after_generation: bool = Field(default=True, env="CLEAR_CACHE_AFTER_GENERATION")
    
    # API Settings
    max_concurrent_requests: int = Field(default=3, env="MAX_CONCURRENT_REQUESTS")
    request_timeout: int = Field(default=300, env="REQUEST_TIMEOUT")  # seconds
    max_prompt_length: int = Field(default=500, env="MAX_PROMPT_LENGTH")
    enable_generation_queue: bool = Field(default=False, env="ENABLE_GENERATION_QUEUE")
    
    # Security Settings
    api_key: Optional[str] = Field(default="", env="API_KEY")
    cors_origins: List[str] = Field(default=["*"], env="CORS_ORIGINS")
    
    # Logging Settings
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    log_file: Optional[str] = Field(default="lexigraph.log", env="LOG_FILE")
    enable_request_logging: bool = Field(default=True, env="ENABLE_REQUEST_LOGGING")
    
    # Hugging Face Settings
    hf_token: Optional[str] = Field(default=None, env="HF_TOKEN")
    hf_cache_dir: Optional[str] = Field(default=None, env="HF_CACHE_DIR")
    
    # Style Presets
    style_presets: dict = {
        "realistic": {
            "positive_suffix": ", photorealistic, high quality, detailed",
            "negative_prompt": "cartoon, anime, painting, drawing, low quality, blurry"
        },
        "artistic": {
            "positive_suffix": ", artistic, creative, beautiful composition",
            "negative_prompt": "low quality, blurry, distorted"
        },
        "anime": {
            "positive_suffix": ", anime style, manga, detailed anime art",
            "negative_prompt": "realistic, photographic, low quality"
        },
        "portrait": {
            "positive_suffix": ", portrait photography, professional lighting, high detail",
            "negative_prompt": "low quality, blurry, distorted face, multiple people"
        },
        "landscape": {
            "positive_suffix": ", landscape photography, scenic, beautiful vista",
            "negative_prompt": "people, portraits, low quality, blurry"
        }
    }
    
    # Safety Settings
    enable_safety_checker: bool = Field(default=False, env="ENABLE_SAFETY_CHECKER")
    nsfw_threshold: float = Field(default=0.7, env="NSFW_THRESHOLD")
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=False)

# Global settings instance
settings = Settings()

def get_device():
    """Determine the best available device."""
    import torch
    
    if settings.device == "auto":
        if torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps"
        else:
            return "cpu"
    else:
        return settings.device

def get_torch_dtype():
    """Get the appropriate torch dtype."""
    import torch
    
    if settings.torch_dtype == "float16":
        return torch.float16
    elif settings.torch_dtype == "bfloat16":
        return torch.bfloat16
    else:
        return torch.float32

def validate_model_path():
    """Validate that the model path exists."""
    model_path = Path(settings.model_path)
    if not model_path.exists():
        raise FileNotFoundError(f"Model path does not exist: {model_path}")
    return model_path

def get_memory_info():
    """Get current memory usage information."""
    import psutil
    import torch
    
    memory_info = {
        "system_memory": {
            "total": psutil.virtual_memory().total / (1024**3),  # GB
            "available": psutil.virtual_memory().available / (1024**3),  # GB
            "percent": psutil.virtual_memory().percent
        }
    }
    
    if torch.cuda.is_available():
        memory_info["gpu_memory"] = {
            "total": torch.cuda.get_device_properties(0).total_memory / (1024**3),  # GB
            "allocated": torch.cuda.memory_allocated() / (1024**3),  # GB
            "cached": torch.cuda.memory_reserved() / (1024**3),  # GB
        }
    
    return memory_info

def cleanup_memory():
    """Clean up GPU memory."""
    import torch
    import gc
    
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()

# Model configuration based on type
MODEL_CONFIGS = {
    "lora": {
        "requires_base_model": True,
        "adapter_type": "lora",
        "load_method": "from_pretrained"
    },
    "dreambooth": {
        "requires_base_model": False,
        "adapter_type": None,
        "load_method": "from_pretrained"
    },
    "base": {
        "requires_base_model": False,
        "adapter_type": None,
        "load_method": "from_pretrained"
    }
}

# Supported image formats
SUPPORTED_FORMATS = ["JPEG", "PNG", "WEBP"]

# Default negative prompts for different styles
DEFAULT_NEGATIVE_PROMPTS = {
    "general": "low quality, blurry, distorted, deformed, bad anatomy, bad proportions, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, extra arms, extra legs, mutated hands, poorly drawn hands, poorly drawn face, mutation, deformed, ugly, bad hands, bad fingers, watermark, signature, text",
    "realistic": "cartoon, anime, painting, drawing, sketch, low quality, blurry, distorted",
    "artistic": "low quality, blurry, distorted, bad composition",
    "anime": "realistic, photographic, low quality, blurry, distorted",
}

# Scheduler configurations
SCHEDULER_CONFIGS = {
    "ddim": {
        "class": "DDIMScheduler",
        "config": {"num_train_timesteps": 1000}
    },
    "dpm": {
        "class": "DPMSolverMultistepScheduler",
        "config": {"num_train_timesteps": 1000}
    },
    "euler": {
        "class": "EulerDiscreteScheduler",
        "config": {"num_train_timesteps": 1000}
    },
    "euler_a": {
        "class": "EulerAncestralDiscreteScheduler",
        "config": {"num_train_timesteps": 1000}
    }
}
