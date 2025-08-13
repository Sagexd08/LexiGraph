import logging
import asyncio
import time
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
import psutil

from ..models.image_generator import image_generator
from ..config import settings, get_memory_info, cleanup_memory

logger = logging.getLogger(__name__)

router = APIRouter()

class GenerateImageRequest(BaseModel):
    """Request model for image generation."""
    prompt: str = Field(..., min_length=1, max_length=settings.max_prompt_length, description="Text prompt for image generation")
    negative_prompt: Optional[str] = Field(None, max_length=settings.max_prompt_length, description="Negative prompt to avoid certain features")
    width: int = Field(default=settings.default_width, ge=64, le=settings.max_width, description="Image width in pixels")
    height: int = Field(default=settings.default_height, ge=64, le=settings.max_height, description="Image height in pixels")
    num_inference_steps: int = Field(default=settings.default_steps, ge=1, le=settings.max_steps, description="Number of denoising steps")
    guidance_scale: float = Field(default=settings.default_guidance_scale, ge=1.0, le=settings.max_guidance_scale, description="Guidance scale for classifier-free guidance")
    seed: Optional[int] = Field(None, ge=0, le=2**32-1, description="Random seed for reproducibility")
    style: Optional[str] = Field(None, description="Style preset to apply")
    scheduler: Optional[str] = Field(default="ddim", description="Scheduler to use")
    
    @field_validator('width', 'height')
    @classmethod
    def validate_dimensions(cls, v):
        """Ensure dimensions are multiples of 8."""
        if v % 8 != 0:
            raise ValueError("Width and height must be multiples of 8")
        return v
    
    @field_validator('style')
    @classmethod
    def validate_style(cls, v):
        """Validate style preset."""
        if v is not None and v not in settings.style_presets:
            available_styles = list(settings.style_presets.keys())
            raise ValueError(f"Invalid style. Available styles: {available_styles}")
        return v
    
    @field_validator('scheduler')
    @classmethod
    def validate_scheduler(cls, v):
        valid_schedulers = ["ddim", "dpm", "euler", "euler_a"]
        if v not in valid_schedulers:
            raise ValueError(f"Invalid scheduler. Available schedulers: {valid_schedulers}")
        return v

class GenerateImageResponse(BaseModel):
    success: bool
    image: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict[str, Any]
    generation_time: Optional[float] = None

class ModelInfoResponse(BaseModel):
    is_loaded: bool
    model_type: str
    device: str
    torch_dtype: str
    current_scheduler: str
    base_model: str
    model_path: str
    optimizations: Dict[str, bool]

class SystemInfoResponse(BaseModel):
    memory_info: Dict[str, Any]
    device_info: Dict[str, Any]
    model_info: Dict[str, Any]
    settings: Dict[str, Any]

# Dependency for API key authentication
async def verify_api_key(api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    if settings.api_key is not None:
        if api_key != settings.api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
    return True

# Semaphore for limiting concurrent requests
generation_semaphore = asyncio.Semaphore(settings.max_concurrent_requests)

@router.post("/generate", response_model=GenerateImageResponse)
async def generate_image(
    request: GenerateImageRequest,
    background_tasks: BackgroundTasks,
    authenticated: bool = Depends(verify_api_key)
):
    """
    Generate an image from a text prompt.
    
    This endpoint accepts a text prompt and various generation parameters,
    then returns a base64-encoded image along with metadata.
    """
    async with generation_semaphore:
        start_time = time.time()
        
        try:
            # Check if model is loaded
            if not image_generator.is_loaded:
                logger.info("Model not loaded, loading now...")
                success = image_generator.load_model()
                if not success:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Failed to load model"
                    )
            
            # Generate image
            result = image_generator.generate_image(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                width=request.width,
                height=request.height,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
                seed=request.seed,
                style=request.style,
                scheduler=request.scheduler
            )
            
            generation_time = time.time() - start_time
            
            if result["success"]:
                logger.info(f"Image generated successfully in {generation_time:.2f}s")
                return GenerateImageResponse(
                    success=True,
                    image=result["image"],
                    metadata=result["metadata"],
                    generation_time=generation_time
                )
            else:
                logger.error(f"Image generation failed: {result.get('error', 'Unknown error')}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result.get("error", "Image generation failed")
                )
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during image generation: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Internal server error: {str(e)}"
            )

@router.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info(authenticated: bool = Depends(verify_api_key)):
    """
    Get information about the currently loaded model.
    
    Returns details about the model type, device, optimizations, and configuration.
    """
    try:
        model_info = image_generator.get_model_info()
        return ModelInfoResponse(**model_info)
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get model info: {str(e)}"
        )

class LoadModelRequest(BaseModel):
    model_path: Optional[str] = None

@router.post("/model/load")
async def load_model(
    body: LoadModelRequest | None = None,
    authenticated: bool = Depends(verify_api_key)
):
    """
    Load or reload the model.
    
    Optionally specify a different model path to load.
    """
    try:
        model_path_val = body.model_path if body and body.model_path else None
        success = image_generator.load_model(model_path_val)
        if success:
            return {"success": True, "message": "Model loaded successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to load model"
            )
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load model: {str(e)}"
        )

@router.post("/model/unload")
async def unload_model(authenticated: bool = Depends(verify_api_key)):
    """
    Unload the current model and free memory.
    
    Useful for switching models or freeing up GPU memory.
    """
    try:
        image_generator.unload_model()
        return {"success": True, "message": "Model unloaded successfully"}
    except Exception as e:
        logger.error(f"Error unloading model: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unload model: {str(e)}"
        )

@router.get("/system/info", response_model=SystemInfoResponse)
async def get_system_info(authenticated: bool = Depends(verify_api_key)):
    """
    Get comprehensive system information.
    
    Returns memory usage, device information, model status, and configuration.
    """
    try:
        import torch
        
        # Get memory info
        memory_info = get_memory_info()
        
        # Get device info
        device_info = {
            "device": image_generator.device,
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        }
        
        if torch.cuda.is_available():
            device_info["cuda_device_name"] = torch.cuda.get_device_name(0)
            device_info["cuda_capability"] = torch.cuda.get_device_capability(0)
        
        # Get model info
        model_info = image_generator.get_model_info()
        
        # Get relevant settings
        settings_info = {
            "model_type": settings.model_type,
            "base_model": settings.base_model,
            "max_concurrent_requests": settings.max_concurrent_requests,
            "enable_xformers": settings.enable_xformers,
            "enable_cpu_offload": settings.enable_cpu_offload,
            "enable_attention_slicing": settings.enable_attention_slicing,
        }
        
        return SystemInfoResponse(
            memory_info=memory_info,
            device_info=device_info,
            model_info=model_info,
            settings=settings_info
        )
        
    except Exception as e:
        logger.error(f"Error getting system info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get system info: {str(e)}"
        )

@router.post("/system/cleanup")
async def cleanup_system_memory(authenticated: bool = Depends(verify_api_key)):
    """
    Clean up system memory and GPU cache.
    
    Forces garbage collection and clears GPU memory cache.
    """
    try:
        cleanup_memory()
        return {"success": True, "message": "Memory cleanup completed"}
    except Exception as e:
        logger.error(f"Error during memory cleanup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Memory cleanup failed: {str(e)}"
        )

@router.get("/styles")
async def get_available_styles():
    """
    Get list of available style presets.
    
    Returns all configured style presets with their descriptions.
    """
    try:
        styles = {}
        for style_name, style_config in settings.style_presets.items():
            styles[style_name] = {
                "name": style_name,
                "positive_suffix": style_config.get("positive_suffix", ""),
                "negative_prompt": style_config.get("negative_prompt", "")
            }
        
        return {
            "success": True,
            "styles": styles,
            "count": len(styles)
        }
    except Exception as e:
        logger.error(f"Error getting styles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get styles: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint.
    
    Returns basic service status and availability.
    """
    try:
        return {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "model_loaded": image_generator.is_loaded,
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )
