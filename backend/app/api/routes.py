import logging
import asyncio
import time
from typing import Optional, Dict, Any, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends, status, Header, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import psutil
from pathlib import Path

from ..models.image_generator import image_generator
from ..config import settings, get_memory_info, cleanup_memory
from ..utils.job_queue import job_queue

logger = logging.getLogger(__name__)

router = APIRouter()

def create_cors_response(content, status_code=200):
    """Create a response with CORS headers"""
    response = JSONResponse(content=content, status_code=status_code)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@router.options("/{path:path}")
async def options_handler(path: str):
    """Handle preflight OPTIONS requests"""
    return create_cors_response({"message": "OK"})

class GenerateImageRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=settings.max_prompt_length, description="Text prompt for image generation")
    negative_prompt: Optional[str] = Field(None, max_length=settings.max_prompt_length, description="Negative prompt to avoid certain features")
    width: int = Field(default=settings.default_width, ge=64, le=settings.max_width, description="Image width in pixels")
    height: int = Field(default=settings.default_height, ge=64, le=settings.max_height, description="Image height in pixels")
    num_inference_steps: int = Field(default=settings.default_steps, ge=1, le=settings.max_steps, description="Number of denoising steps")
    guidance_scale: float = Field(default=settings.default_guidance_scale, ge=1.0, le=settings.max_guidance_scale, description="Guidance scale for classifier-free guidance")
    seed: Optional[int] = Field(None, ge=0, le=2**32-1, description="Random seed for reproducibility")
    style: Optional[str] = Field(None, description="Style preset to apply")
    scheduler: Optional[str] = Field(default="ddim", description="Scheduler to use")
    use_cache: bool = Field(default=True, description="Whether to use cached results")

    @field_validator('width', 'height')
    @classmethod
    def validate_dimensions(cls, v):
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

async def verify_api_key(api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    if settings.api_key is not None and settings.api_key != "":
        if api_key != settings.api_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid API key"
            )
    return True

generation_semaphore = asyncio.Semaphore(settings.max_concurrent_requests)

USE_QUEUE = getattr(settings, "enable_generation_queue", False)

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
    if USE_QUEUE:
        async def _run_generation():
            if not image_generator.is_loaded:
                image_generator.load_model()
            return image_generator.generate_image(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                width=request.width,
                height=request.height,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
                seed=request.seed,
                style=request.style,
                scheduler=request.scheduler,
            )
        job_id = await job_queue.submit(_run_generation)
        return GenerateImageResponse(success=True, image=None, metadata={"job_id": job_id}, generation_time=None)

    async with generation_semaphore:
        start_time = time.time()

        try:
            if not image_generator.is_loaded:
                logger.info("Model not loaded, loading now...")
                success = image_generator.load_model()
                if not success:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Failed to load model"
                    )

            result = image_generator.generate_image(
                prompt=request.prompt,
                negative_prompt=request.negative_prompt,
                width=request.width,
                height=request.height,
                num_inference_steps=request.num_inference_steps,
                guidance_scale=request.guidance_scale,
                seed=request.seed,
                style=request.style,
                scheduler=request.scheduler,
                use_cache=request.use_cache
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

        memory_info = get_memory_info()

        device_info = {
            "device": image_generator.device,
            "cuda_available": torch.cuda.is_available(),
            "cuda_device_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
        }

        if torch.cuda.is_available():
            device_info["cuda_device_name"] = torch.cuda.get_device_name(0)
            device_info["cuda_capability"] = torch.cuda.get_device_capability(0)

        model_info = image_generator.get_model_info()

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

@router.get("/job/{job_id}")
async def get_job_status(job_id: str, authenticated: bool = Depends(verify_api_key)):
    status_info = job_queue.status(job_id)
    if not status_info:
        raise HTTPException(status_code=404, detail="Job not found")
    return status_info





@router.get("/cache/stats")
async def get_cache_stats(authenticated: bool = Depends(verify_api_key)):
    """
    Get cache statistics.

    Returns information about the current generation cache usage.
    """
    try:
        cache_stats = image_generator.get_cache_stats()
        return {
            "success": True,
            "cache_stats": cache_stats
        }
    except Exception as e:
        logger.error(f"Error getting cache stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cache stats: {str(e)}"
        )

@router.post("/cache/clear")
async def clear_cache(authenticated: bool = Depends(verify_api_key)):
    """
    Clear the generation cache.

    Removes all cached generation results to free memory.
    """
    try:
        image_generator.clear_cache()
        return {
            "success": True,
            "message": "Generation cache cleared successfully"
        }
    except Exception as e:
        logger.error(f"Error clearing cache: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear cache: {str(e)}"
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
        content = {
            "status": "healthy",
            "service": settings.app_name,
            "version": settings.app_version,
            "model_loaded": image_generator.is_loaded,
            "timestamp": time.time()
        }
        return create_cors_response(content)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return create_cors_response(
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )
