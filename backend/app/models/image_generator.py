"""
Image Generation Model Handler for Lexigraph

Handles loading and inference of Stable Diffusion models with LoRA/DreamBooth support.
Provides optimized generation with memory management and error handling.
"""

import logging
import torch
import gc
from typing import Optional, Dict, Any, Callable
from pathlib import Path
from PIL import Image
import io
import base64
from diffusers import (
    StableDiffusionPipeline,
    DDIMScheduler,
    DPMSolverMultistepScheduler,
    EulerDiscreteScheduler,
    EulerAncestralDiscreteScheduler,
    AutoencoderKL,
    UNet2DConditionModel
)
from diffusers.utils import is_xformers_available
from transformers import CLIPTextModel, CLIPTokenizer
import numpy as np

from ..config import settings, get_device, get_torch_dtype, cleanup_memory

logger = logging.getLogger(__name__)

class ImageGenerator:
    """Main image generation class with model management."""
    
    def __init__(self):
        """Initialize the image generator."""
        self.pipeline = None
        self.device = get_device()
        self.torch_dtype = get_torch_dtype()
        self.is_loaded = False
        self.model_type = settings.model_type
        self.current_scheduler = "ddim"
        
        logger.info(f"Initializing ImageGenerator on device: {self.device}")
        logger.info(f"Using torch dtype: {self.torch_dtype}")
        
    def load_model(self, model_path: Optional[str] = None) -> bool:
        """
        Load the Stable Diffusion model with optional LoRA/DreamBooth weights.
        
        Args:
            model_path: Path to model weights (optional, uses config default)
            
        Returns:
            bool: True if model loaded successfully
        """
        try:
            if model_path is None:
                model_path = settings.model_path
                
            model_path = Path(model_path)
            logger.info(f"Loading model from: {model_path}")
            logger.info(f"Model type: {self.model_type}")
            
            # Load base pipeline
            if self.model_type == "lora":
                # Load base model first
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    settings.base_model,
                    torch_dtype=self.torch_dtype,
                    safety_checker=None,
                    requires_safety_checker=False,
                    use_safetensors=settings.use_safetensors,
                    cache_dir=settings.hf_cache_dir,
                    token=settings.hf_token
                )

                # Load LoRA weights (Diffusers-native)
                if model_path.exists():
                    logger.info("Loading LoRA weights (Diffusers)")
                    try:
                        adapter_name = "default"
                        self.pipeline.load_lora_weights(
                            str(model_path),
                            adapter_name=adapter_name,
                        )
                        # Optionally set adapter scale
                        try:
                            scale = getattr(settings, "lora_scale", 1.0)
                        except Exception:
                            scale = 1.0
                        self.pipeline.set_adapters([adapter_name], [scale])
                        logger.info("LoRA weights loaded successfully")
                    except Exception as e:
                        logger.error(f"Failed to load LoRA weights: {e}")
                        logger.warning("Proceeding with base model")
                else:
                    logger.warning(f"LoRA weights not found at {model_path}, using base model")
                    
            elif self.model_type in ["dreambooth", "base"]:
                # Load fine-tuned or base model directly
                if model_path.exists() and self.model_type == "dreambooth":
                    self.pipeline = StableDiffusionPipeline.from_pretrained(
                        str(model_path),
                        torch_dtype=self.torch_dtype,
                        safety_checker=None,
                        requires_safety_checker=False,
                        use_safetensors=settings.use_safetensors,
                        cache_dir=settings.hf_cache_dir,
                        token=settings.hf_token
                    )
                else:
                    self.pipeline = StableDiffusionPipeline.from_pretrained(
                        settings.base_model,
                        torch_dtype=self.torch_dtype,
                        safety_checker=None,
                        requires_safety_checker=False,
                        use_safetensors=settings.use_safetensors,
                        cache_dir=settings.hf_cache_dir,
                        token=settings.hf_token
                    )
            else:
                raise ValueError(f"Unsupported model type: {self.model_type}")
            
            # Move to device
            self.pipeline = self.pipeline.to(self.device)
            
            # Apply optimizations
            self._apply_optimizations()
            
            self.is_loaded = True
            logger.info("Model loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            self.is_loaded = False
            return False
    
    def _apply_optimizations(self):
        """Apply memory and performance optimizations."""
        try:
            # Enable memory efficient attention
            if settings.enable_xformers and is_xformers_available():
                self.pipeline.enable_xformers_memory_efficient_attention()
                logger.info("Enabled xformers memory efficient attention")
            
            # Enable attention slicing for memory efficiency
            if settings.enable_attention_slicing:
                self.pipeline.enable_attention_slicing()
                logger.info("Enabled attention slicing")
            
            # Enable CPU offload for large models
            if settings.enable_cpu_offload and self.device == "cuda":
                self.pipeline.enable_model_cpu_offload()
                logger.info("Enabled model CPU offload")
            
            # Set scheduler
            self.set_scheduler("ddim")
            
        except Exception as e:
            logger.warning(f"Some optimizations failed: {str(e)}")
    
    def set_scheduler(self, scheduler_name: str):
        """
        Set the diffusion scheduler.
        
        Args:
            scheduler_name: Name of scheduler ("ddim", "dpm", "euler", "euler_a")
        """
        try:
            if scheduler_name == "ddim":
                self.pipeline.scheduler = DDIMScheduler.from_config(self.pipeline.scheduler.config)
            elif scheduler_name == "dpm":
                self.pipeline.scheduler = DPMSolverMultistepScheduler.from_config(self.pipeline.scheduler.config)
            elif scheduler_name == "euler":
                self.pipeline.scheduler = EulerDiscreteScheduler.from_config(self.pipeline.scheduler.config)
            elif scheduler_name == "euler_a":
                self.pipeline.scheduler = EulerAncestralDiscreteScheduler.from_config(self.pipeline.scheduler.config)
            else:
                logger.warning(f"Unknown scheduler: {scheduler_name}, keeping current")
                return
                
            self.current_scheduler = scheduler_name
            logger.info(f"Set scheduler to: {scheduler_name}")
            
        except Exception as e:
            logger.error(f"Failed to set scheduler: {str(e)}")
    
    def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 512,
        height: int = 512,
        num_inference_steps: int = 20,
        guidance_scale: float = 7.5,
        seed: Optional[int] = None,
        style: Optional[str] = None,
        scheduler: Optional[str] = None,
        progress_callback: Optional[Callable[[int, float], None]] = None,
        callback_steps: int = 5,
    ) -> Dict[str, Any]:
        """
        Generate an image from a text prompt.
        
        Args:
            prompt: Text prompt for image generation
            negative_prompt: Negative prompt to avoid certain features
            width: Image width in pixels
            height: Image height in pixels
            num_inference_steps: Number of denoising steps
            guidance_scale: Guidance scale for classifier-free guidance
            seed: Random seed for reproducibility
            style: Style preset to apply
            scheduler: Scheduler to use for this generation
            
        Returns:
            Dict containing generated image data and metadata
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            # Validate parameters
            width = min(max(width, 64), settings.max_width)
            height = min(max(height, 64), settings.max_height)
            num_inference_steps = min(max(num_inference_steps, 1), settings.max_steps)
            guidance_scale = min(max(guidance_scale, 1.0), settings.max_guidance_scale)
            
            # Apply style preset if specified
            if style and style in settings.style_presets:
                style_config = settings.style_presets[style]
                prompt = prompt + style_config.get("positive_suffix", "")
                if negative_prompt is None:
                    negative_prompt = style_config.get("negative_prompt", "")
            
            # Set default negative prompt if none provided
            if negative_prompt is None:
                negative_prompt = "low quality, blurry, distorted"
            
            # Set scheduler if specified
            if scheduler and scheduler != self.current_scheduler:
                self.set_scheduler(scheduler)
            
            # Set random seed
            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)
            
            logger.info(f"Generating image: {width}x{height}, steps: {num_inference_steps}, guidance: {guidance_scale}")
            
            # Generate image
            # Optional progress callback wrapper for Diffusers
            cb = None
            if progress_callback is not None and num_inference_steps > 0:
                total = max(num_inference_steps, 1)
                def _cb(step, timestep, latents):
                    pct = int((step / total) * 100)
                    try:
                        progress_callback(pct, step / float(total))
                    except Exception:
                        pass
                cb = _cb

            with torch.autocast(self.device, dtype=self.torch_dtype):
                if cb is not None:
                    result = self.pipeline(
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        width=width,
                        height=height,
                        num_inference_steps=num_inference_steps,
                        guidance_scale=guidance_scale,
                        generator=generator,
                        callback=cb,
                        callback_steps=max(1, int(callback_steps)),
                        return_dict=True
                    )
                else:
                    result = self.pipeline(
                        prompt=prompt,
                        negative_prompt=negative_prompt,
                        width=width,
                        height=height,
                        num_inference_steps=num_inference_steps,
                        guidance_scale=guidance_scale,
                        generator=generator,
                        return_dict=True
                    )
            
            # Get the generated image
            image = result.images[0]
            
            # Convert to base64
            image_base64 = self._image_to_base64(image)
            
            # Clean up memory if configured
            if settings.clear_cache_after_generation:
                cleanup_memory()
            
            return {
                "success": True,
                "image": image_base64,
                "metadata": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "width": width,
                    "height": height,
                    "num_inference_steps": num_inference_steps,
                    "guidance_scale": guidance_scale,
                    "seed": seed,
                    "style": style,
                    "scheduler": self.current_scheduler,
                    "model_type": self.model_type
                }
            }
            
        except Exception as e:
            logger.error(f"Image generation failed: {str(e)}")
            cleanup_memory()  # Clean up on error
            return {
                "success": False,
                "error": str(e),
                "metadata": {
                    "prompt": prompt,
                    "error_type": type(e).__name__
                }
            }
    
    def _image_to_base64(self, image: Image.Image, format: str = "PNG") -> str:
        """
        Convert PIL Image to base64 string.
        
        Args:
            image: PIL Image object
            format: Image format (PNG, JPEG, WEBP)
            
        Returns:
            Base64 encoded image string
        """
        buffer = io.BytesIO()
        image.save(buffer, format=format, quality=95 if format == "JPEG" else None)
        image_bytes = buffer.getvalue()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/{format.lower()};base64,{image_base64}"
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the loaded model.
        
        Returns:
            Dict containing model information
        """
        return {
            "is_loaded": self.is_loaded,
            "model_type": self.model_type,
            "device": self.device,
            "torch_dtype": str(self.torch_dtype),
            "current_scheduler": self.current_scheduler,
            "base_model": settings.base_model,
            "model_path": settings.model_path,
            "optimizations": {
                "xformers_enabled": settings.enable_xformers and is_xformers_available(),
                "attention_slicing": settings.enable_attention_slicing,
                "cpu_offload": settings.enable_cpu_offload
            }
        }
    
    def unload_model(self):
        """Unload the model and free memory."""
        if self.pipeline is not None:
            del self.pipeline
            self.pipeline = None
        
        self.is_loaded = False
        cleanup_memory()
        logger.info("Model unloaded and memory cleaned")

# Global model instance
image_generator = ImageGenerator()
