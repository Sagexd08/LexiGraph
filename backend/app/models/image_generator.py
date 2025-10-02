"""
Production-Ready Image Generation Model Handler for LexiGraph

Handles loading and inference of custom fine-tuned Stable Diffusion models with:
- LoRA/DreamBooth support
- Advanced optimizations (ONNX, Torch 2.0 compile)
- LRU caching for repeated prompts
- Memory management and error handling
- Progress callbacks and real-time generation
"""

import logging
import torch
import gc
import hashlib
import time
from typing import Optional, Dict, Any, Callable, List
from pathlib import Path
from PIL import Image
import io
import base64
from functools import lru_cache
from diffusers import (
    StableDiffusionPipeline,
    StableDiffusionXLPipeline,
    StableDiffusionControlNetPipeline,
    StableDiffusionImg2ImgPipeline,
    StableDiffusionInpaintPipeline,
    DDIMScheduler,
    DPMSolverMultistepScheduler,
    EulerDiscreteScheduler,
    EulerAncestralDiscreteScheduler,
    LMSDiscreteScheduler,
    PNDMScheduler,
    UniPCMultistepScheduler,
    AutoencoderKL,
    UNet2DConditionModel,
    ControlNetModel
)
from diffusers.utils import is_xformers_available
from transformers import CLIPTextModel, CLIPTokenizer, CLIPTextModelWithProjection
import numpy as np
from compel import Compel, ReturnedEmbeddingsType

from ..config import settings, get_device, get_torch_dtype, cleanup_memory

logger = logging.getLogger(__name__)

class AdvancedImageGenerator:
    """Advanced production-ready image generation class with multiple model support."""

    def __init__(self):
        self.pipeline = None
        self.xl_pipeline = None
        self.controlnet_pipeline = None
        self.img2img_pipeline = None
        self.inpaint_pipeline = None
        self.device = get_device()
        self.torch_dtype = get_torch_dtype()
        self.is_loaded = False
        self.model_type = settings.model_type
        self.current_scheduler = "ddim"
        self.generation_cache = {}
        self.cache_max_size = getattr(settings, 'cache_max_size', 100)

        # Advanced features
        self.use_torch_compile = getattr(settings, 'use_torch_compile', False)
        self.enable_cpu_offload = getattr(settings, 'enable_cpu_offload', True)
        self.use_compel = getattr(settings, 'use_compel', True)  # Advanced prompt weighting
        self.compel = None
        self.xl_compel = None

        # Model variants
        self.available_models = {
            "sd15": "runwayml/stable-diffusion-v1-5",
            "sdxl": "stabilityai/stable-diffusion-xl-base-1.0",
            "realistic": "SG161222/Realistic_Vision_V6.0_B1_noVAE",
            "anime": "Linaqruf/anything-v3.0",
            "artistic": "prompthero/openjourney-v4"
        }

        # Advanced schedulers
        self.schedulers = {
            "ddim": DDIMScheduler,
            "dpm": DPMSolverMultistepScheduler,
            "euler": EulerDiscreteScheduler,
            "euler_a": EulerAncestralDiscreteScheduler,
            "lms": LMSDiscreteScheduler,
            "pndm": PNDMScheduler,
            "unipc": UniPCMultistepScheduler
        }

        logger.info(f"Initializing Advanced LexiGraph ImageGenerator on device: {self.device}")
        logger.info(f"Using torch dtype: {self.torch_dtype}")
        logger.info(f"Cache enabled with max size: {self.cache_max_size}")
        logger.info(f"Available models: {list(self.available_models.keys())}")
        logger.info(f"Available schedulers: {list(self.schedulers.keys())}")

    def load_model(self, model_path: Optional[str] = None, model_variant: str = "sd15") -> bool:
        """Load advanced Stable Diffusion models with multiple variant support."""

        try:
            if model_path is None:
                model_path = settings.model_path

            # Determine model to load
            if model_variant in self.available_models:
                base_model = self.available_models[model_variant]
            else:
                base_model = settings.base_model

            model_path = Path(model_path) if model_path else None
            logger.info(f"Loading model variant: {model_variant}")
            logger.info(f"Base model: {base_model}")
            logger.info(f"Model type: {self.model_type}")

            # Load SDXL pipeline if specified
            if model_variant == "sdxl":
                self._load_sdxl_pipeline(base_model)
            else:
                self._load_standard_pipeline(base_model, model_path)

            # Load additional pipelines
            self._load_additional_pipelines()

            # Apply optimizations
            self._apply_optimizations()

            # Setup advanced prompt processing
            if self.use_compel:
                self._setup_compel()

            # Apply Torch compilation if enabled
            if self.use_torch_compile and hasattr(torch, 'compile'):
                self._apply_torch_compilation()

            self.is_loaded = True
            logger.info("Advanced LexiGraph model loaded successfully with all features")
            return True

        except Exception as e:
            logger.error(f"Failed to load advanced model: {str(e)}")
            self.is_loaded = False
            return False

    def _load_standard_pipeline(self, base_model: str, model_path: Optional[Path]):
        """Load standard SD 1.5 pipeline with LoRA/DreamBooth support."""

        if self.model_type == "lora":

            self.pipeline = StableDiffusionPipeline.from_pretrained(
                base_model,
                torch_dtype=self.torch_dtype,
                safety_checker=None,
                requires_safety_checker=False,
                use_safetensors=settings.use_safetensors,
                cache_dir=settings.hf_cache_dir,
                token=getattr(settings, 'hf_token', None)
            )

            # Load LoRA weights if available
            if model_path and model_path.exists():
                logger.info("Loading LoRA weights")
                try:
                    adapter_name = "default"
                    self.pipeline.load_lora_weights(
                        str(model_path),
                        adapter_name=adapter_name,
                    )
                    scale = getattr(settings, "lora_scale", 1.0)
                    self.pipeline.set_adapters([adapter_name], [scale])
                    logger.info("LoRA weights loaded successfully")
                except Exception as e:
                    logger.error(f"Failed to load LoRA weights: {e}")

        elif self.model_type in ["dreambooth", "base"]:
            if model_path and model_path.exists() and self.model_type == "dreambooth":
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    str(model_path),
                    torch_dtype=self.torch_dtype,
                    safety_checker=None,
                    requires_safety_checker=False,
                    use_safetensors=settings.use_safetensors,
                    cache_dir=settings.hf_cache_dir,
                    token=None
                )
            else:
                self.pipeline = StableDiffusionPipeline.from_pretrained(
                    base_model,
                    torch_dtype=self.torch_dtype,
                    safety_checker=None,
                    requires_safety_checker=False,
                    use_safetensors=settings.use_safetensors,
                    cache_dir=settings.hf_cache_dir,
                    token=None
                )
        else:
            raise ValueError(f"Unsupported model type: {self.model_type}")

        self.pipeline = self.pipeline.to(self.device)

    def _load_sdxl_pipeline(self, base_model: str):
        """Load Stable Diffusion XL pipeline."""
        logger.info("Loading SDXL pipeline")
        self.xl_pipeline = StableDiffusionXLPipeline.from_pretrained(
            base_model,
            torch_dtype=self.torch_dtype,
            use_safetensors=True,
            cache_dir=settings.hf_cache_dir,
            token=getattr(settings, 'hf_token', None)
        ).to(self.device)

    def _load_additional_pipelines(self):
        """Load additional specialized pipelines."""
        try:
            # Load img2img pipeline
            if self.pipeline:
                self.img2img_pipeline = StableDiffusionImg2ImgPipeline(
                    vae=self.pipeline.vae,
                    text_encoder=self.pipeline.text_encoder,
                    tokenizer=self.pipeline.tokenizer,
                    unet=self.pipeline.unet,
                    scheduler=self.pipeline.scheduler,
                    safety_checker=None,
                    feature_extractor=None,
                    requires_safety_checker=False
                )

                # Load inpainting pipeline
                self.inpaint_pipeline = StableDiffusionInpaintPipeline(
                    vae=self.pipeline.vae,
                    text_encoder=self.pipeline.text_encoder,
                    tokenizer=self.pipeline.tokenizer,
                    unet=self.pipeline.unet,
                    scheduler=self.pipeline.scheduler,
                    safety_checker=None,
                    feature_extractor=None,
                    requires_safety_checker=False
                )

                logger.info("Additional pipelines loaded successfully")
        except Exception as e:
            logger.warning(f"Failed to load additional pipelines: {e}")

    def _setup_compel(self):
        """Setup Compel for advanced prompt weighting."""
        try:
            if self.pipeline:
                self.compel = Compel(
                    tokenizer=self.pipeline.tokenizer,
                    text_encoder=self.pipeline.text_encoder,
                    returned_embeddings_type=ReturnedEmbeddingsType.PENULTIMATE_HIDDEN_STATES_NON_NORMALIZED,
                    requires_pooled=[False]
                )
                logger.info("Compel setup for advanced prompt weighting")

            if self.xl_pipeline:
                self.xl_compel = Compel(
                    tokenizer=[self.xl_pipeline.tokenizer, self.xl_pipeline.tokenizer_2],
                    text_encoder=[self.xl_pipeline.text_encoder, self.xl_pipeline.text_encoder_2],
                    returned_embeddings_type=ReturnedEmbeddingsType.PENULTIMATE_HIDDEN_STATES_NON_NORMALIZED,
                    requires_pooled=[False, True]
                )
                logger.info("Compel setup for SDXL")
        except Exception as e:
            logger.warning(f"Failed to setup Compel: {e}")
            self.use_compel = False

    def _apply_torch_compilation(self):
        """Apply Torch 2.0 compilation to models."""
        try:
            logger.info("Applying Torch 2.0 compilation...")
            if self.pipeline:
                self.pipeline.unet = torch.compile(self.pipeline.unet, mode="reduce-overhead")
            if self.xl_pipeline:
                self.xl_pipeline.unet = torch.compile(self.xl_pipeline.unet, mode="reduce-overhead")
            logger.info("Torch compilation applied successfully")
        except Exception as e:
            logger.warning(f"Torch compilation failed: {e}")

    def _apply_optimizations(self):
        """Apply memory and performance optimizations."""
        try:

            if settings.enable_xformers and is_xformers_available():
                self.pipeline.enable_xformers_memory_efficient_attention()
                logger.info("Enabled xformers memory efficient attention")


            if settings.enable_attention_slicing:
                self.pipeline.enable_attention_slicing()
                logger.info("Enabled attention slicing")


            if settings.enable_cpu_offload and self.device == "cuda":
                self.pipeline.enable_model_cpu_offload()
                logger.info("Enabled model CPU offload")


            self.set_scheduler("ddim")

        except Exception as e:
            logger.warning(f"Some optimizations failed: {str(e)}")

    def set_scheduler(self, scheduler_name: str):
        """Set the diffusion scheduler for all loaded pipelines."""
        try:
            if scheduler_name not in self.schedulers:
                logger.warning(f"Unknown scheduler: {scheduler_name}, keeping current")
                return

            scheduler_class = self.schedulers[scheduler_name]

            # Update main pipeline
            if self.pipeline:
                self.pipeline.scheduler = scheduler_class.from_config(self.pipeline.scheduler.config)

            # Update XL pipeline
            if self.xl_pipeline:
                self.xl_pipeline.scheduler = scheduler_class.from_config(self.xl_pipeline.scheduler.config)

            # Update additional pipelines
            if self.img2img_pipeline:
                self.img2img_pipeline.scheduler = scheduler_class.from_config(self.img2img_pipeline.scheduler.config)

            if self.inpaint_pipeline:
                self.inpaint_pipeline.scheduler = scheduler_class.from_config(self.inpaint_pipeline.scheduler.config)

            self.current_scheduler = scheduler_name
            logger.info(f"Set scheduler to: {scheduler_name} for all pipelines")

        except Exception as e:
            logger.error(f"Failed to set scheduler: {str(e)}")

    def _get_cache_key(self, prompt: str, negative_prompt: str, width: int, height: int,
                      num_inference_steps: int, guidance_scale: float, seed: Optional[int],
                      style: Optional[str], scheduler: Optional[str]) -> str:
        """Generate cache key for prompt parameters."""
        cache_data = f"{prompt}_{negative_prompt}_{width}_{height}_{num_inference_steps}_{guidance_scale}_{seed}_{style}_{scheduler}"
        return hashlib.md5(cache_data.encode()).hexdigest()

    def _manage_cache(self):
        """Manage cache size by removing oldest entries."""
        if len(self.generation_cache) > self.cache_max_size:

            oldest_keys = list(self.generation_cache.keys())[:-self.cache_max_size]
            for key in oldest_keys:
                del self.generation_cache[key]

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
        use_cache: bool = True,
        model_variant: str = "sd15",
        generation_mode: str = "text2img",
        init_image: Optional[str] = None,
        mask_image: Optional[str] = None,
        strength: float = 0.8,
        controlnet_conditioning_scale: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Generate an image with advanced features and multiple generation modes.

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
            progress_callback: Optional callback for progress updates
            callback_steps: Steps between progress callbacks
            use_cache: Whether to use cached results for identical prompts
            model_variant: Model variant to use (sd15, sdxl, realistic, etc.)
            generation_mode: Generation mode (text2img, img2img, inpaint)
            init_image: Base64 encoded initial image for img2img/inpaint
            mask_image: Base64 encoded mask image for inpainting
            strength: Strength for img2img (0.0-1.0)
            controlnet_conditioning_scale: ControlNet conditioning scale

        Returns:
            Dict containing generated image data and metadata
        """
        if not self.is_loaded:
            raise RuntimeError("Advanced LexiGraph model not loaded. Call load_model() first.")

        start_time = time.time()

        try:
            # Set default negative prompt
            if negative_prompt is None:
                negative_prompt = "low quality, blurry, distorted, deformed, bad anatomy, worst quality, low resolution"

            # Check cache
            cache_key = None
            if use_cache and progress_callback is None and seed is not None:
                cache_key = self._get_cache_key(prompt, negative_prompt, width, height,
                                              num_inference_steps, guidance_scale, seed, style, scheduler)
                if cache_key in self.generation_cache:
                    logger.info("Returning cached result")
                    cached_result = self.generation_cache[cache_key].copy()
                    cached_result["metadata"]["cached"] = True
                    cached_result["metadata"]["generation_time"] = time.time() - start_time
                    return cached_result

            # Validate and clamp parameters
            width = min(max(width, 64), getattr(settings, 'max_width', 1024))
            height = min(max(height, 64), getattr(settings, 'max_height', 1024))
            num_inference_steps = min(max(num_inference_steps, 1), getattr(settings, 'max_steps', 100))
            guidance_scale = min(max(guidance_scale, 1.0), getattr(settings, 'max_guidance_scale', 20.0))

            # Ensure dimensions are multiples of 8
            width = (width // 8) * 8
            height = (height // 8) * 8

            # Apply style presets
            if style and hasattr(settings, 'style_presets') and style in settings.style_presets:
                style_config = settings.style_presets[style]
                prompt = prompt + style_config.get("positive_suffix", "")
                if negative_prompt == "low quality, blurry, distorted, deformed, bad anatomy, worst quality, low resolution":
                    negative_prompt = style_config.get("negative_prompt", negative_prompt)

            # Set scheduler if specified
            if scheduler and scheduler != self.current_scheduler:
                self.set_scheduler(scheduler)

            # Setup generator for reproducibility
            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(seed)

            logger.info(f"Generating image: {width}x{height}, steps: {num_inference_steps}, guidance: {guidance_scale}")
            logger.info(f"Mode: {generation_mode}, Model: {model_variant}")

            # Setup progress callback
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

            # Process prompts with Compel if available
            if self.use_compel and self.compel:
                try:
                    prompt_embeds = self.compel(prompt)
                    negative_prompt_embeds = self.compel(negative_prompt) if negative_prompt else None
                except Exception as e:
                    logger.warning(f"Compel processing failed: {e}")
                    prompt_embeds = None
                    negative_prompt_embeds = None
            else:
                prompt_embeds = None
                negative_prompt_embeds = None

            # Generate based on mode
            with torch.autocast(self.device, dtype=self.torch_dtype):
                if generation_mode == "img2img" and init_image:
                    image = self._generate_img2img(
                        prompt, negative_prompt, init_image, width, height,
                        num_inference_steps, guidance_scale, strength, generator, cb, callback_steps,
                        prompt_embeds, negative_prompt_embeds
                    )
                elif generation_mode == "inpaint" and init_image and mask_image:
                    image = self._generate_inpaint(
                        prompt, negative_prompt, init_image, mask_image, width, height,
                        num_inference_steps, guidance_scale, generator, cb, callback_steps,
                        prompt_embeds, negative_prompt_embeds
                    )
                elif model_variant == "sdxl" and self.xl_pipeline:
                    image = self._generate_sdxl(
                        prompt, negative_prompt, width, height,
                        num_inference_steps, guidance_scale, generator, cb, callback_steps
                    )
                else:
                    # Standard text2img generation
                    image = self._generate_text2img(
                        prompt, negative_prompt, width, height,
                        num_inference_steps, guidance_scale, generator, cb, callback_steps,
                        prompt_embeds, negative_prompt_embeds
                    )


            image_base64 = self._image_to_base64(image)

            generation_time = time.time() - start_time


            result = {
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
                    "model_type": self.model_type,
                    "model_variant": model_variant,
                    "generation_mode": generation_mode,
                    "generation_time": generation_time,
                    "cached": False,
                    "device": str(self.device),
                    "torch_dtype": str(self.torch_dtype),
                    "advanced_features": {
                        "compel_enabled": self.use_compel and self.compel is not None,
                        "torch_compile": self.use_torch_compile,
                        "cpu_offload": self.enable_cpu_offload
                    }
                }
            }


            if use_cache and cache_key and seed is not None:
                self.generation_cache[cache_key] = result.copy()
                self._manage_cache()
                logger.info(f"Result cached with key: {cache_key[:8]}...")


            if getattr(settings, 'clear_cache_after_generation', False):
                cleanup_memory()

            logger.info(f"Advanced image generated successfully in {generation_time:.2f}s")
            return result

        except Exception as e:
            logger.error(f"Advanced LexiGraph image generation failed: {str(e)}")
            cleanup_memory()
            return {
                "success": False,
                "error": str(e),
                "metadata": {
                    "prompt": prompt,
                    "negative_prompt": negative_prompt,
                    "error_type": type(e).__name__,
                    "generation_time": time.time() - start_time,
                    "device": str(self.device),
                    "model_variant": model_variant,
                    "generation_mode": generation_mode
                }
            }

    def _generate_text2img(self, prompt, negative_prompt, width, height, num_inference_steps,
                          guidance_scale, generator, callback, callback_steps, prompt_embeds, negative_prompt_embeds):
        """Generate image from text using standard pipeline."""
        kwargs = {
            "width": width,
            "height": height,
            "num_inference_steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "generator": generator,
            "return_dict": True
        }

        if prompt_embeds is not None:
            kwargs["prompt_embeds"] = prompt_embeds
            kwargs["negative_prompt_embeds"] = negative_prompt_embeds
        else:
            kwargs["prompt"] = prompt
            kwargs["negative_prompt"] = negative_prompt

        if callback:
            kwargs["callback"] = callback
            kwargs["callback_steps"] = max(1, int(callback_steps))

        result = self.pipeline(**kwargs)
        return result.images[0]

    def _generate_sdxl(self, prompt, negative_prompt, width, height, num_inference_steps,
                      guidance_scale, generator, callback, callback_steps):
        """Generate image using SDXL pipeline."""
        kwargs = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "width": width,
            "height": height,
            "num_inference_steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "generator": generator,
            "return_dict": True
        }

        if callback:
            kwargs["callback"] = callback
            kwargs["callback_steps"] = max(1, int(callback_steps))

        result = self.xl_pipeline(**kwargs)
        return result.images[0]

    def _generate_img2img(self, prompt, negative_prompt, init_image, width, height,
                         num_inference_steps, guidance_scale, strength, generator, callback,
                         callback_steps, prompt_embeds, negative_prompt_embeds):
        """Generate image from image using img2img pipeline."""
        if not self.img2img_pipeline:
            raise RuntimeError("Img2img pipeline not loaded")

        # Decode base64 image
        init_pil = self._base64_to_image(init_image)
        init_pil = init_pil.resize((width, height))

        kwargs = {
            "image": init_pil,
            "strength": strength,
            "num_inference_steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "generator": generator,
            "return_dict": True
        }

        if prompt_embeds is not None:
            kwargs["prompt_embeds"] = prompt_embeds
            kwargs["negative_prompt_embeds"] = negative_prompt_embeds
        else:
            kwargs["prompt"] = prompt
            kwargs["negative_prompt"] = negative_prompt

        if callback:
            kwargs["callback"] = callback
            kwargs["callback_steps"] = max(1, int(callback_steps))

        result = self.img2img_pipeline(**kwargs)
        return result.images[0]

    def _generate_inpaint(self, prompt, negative_prompt, init_image, mask_image, width, height,
                         num_inference_steps, guidance_scale, generator, callback, callback_steps,
                         prompt_embeds, negative_prompt_embeds):
        """Generate image using inpainting pipeline."""
        if not self.inpaint_pipeline:
            raise RuntimeError("Inpaint pipeline not loaded")

        # Decode base64 images
        init_pil = self._base64_to_image(init_image).resize((width, height))
        mask_pil = self._base64_to_image(mask_image).resize((width, height))

        kwargs = {
            "image": init_pil,
            "mask_image": mask_pil,
            "width": width,
            "height": height,
            "num_inference_steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "generator": generator,
            "return_dict": True
        }

        if prompt_embeds is not None:
            kwargs["prompt_embeds"] = prompt_embeds
            kwargs["negative_prompt_embeds"] = negative_prompt_embeds
        else:
            kwargs["prompt"] = prompt
            kwargs["negative_prompt"] = negative_prompt

        if callback:
            kwargs["callback"] = callback
            kwargs["callback_steps"] = max(1, int(callback_steps))

        result = self.inpaint_pipeline(**kwargs)
        return result.images[0]

    def clear_cache(self):
        """Clear the generation cache."""
        self.generation_cache.clear()
        logger.info("Generation cache cleared")

    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "cache_size": len(self.generation_cache),
            "cache_max_size": self.cache_max_size,
            "cache_usage": len(self.generation_cache) / self.cache_max_size if self.cache_max_size > 0 else 0
        }

    def _image_to_base64(self, image: Image.Image, format: str = "PNG") -> str:
        """Convert PIL Image to base64 string."""
        buffer = io.BytesIO()
        image.save(buffer, format=format, quality=95 if format == "JPEG" else None)
        image_bytes = buffer.getvalue()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        return f"data:image/{format.lower()};base64,{image_base64}"

    def _base64_to_image(self, base64_string: str) -> Image.Image:
        """Convert base64 string to PIL Image."""
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        image_bytes = base64.b64decode(base64_string)
        return Image.open(io.BytesIO(image_bytes)).convert('RGB')

    def get_model_info(self) -> Dict[str, Any]:
        """Get comprehensive information about loaded models and capabilities."""
        return {
            "is_loaded": self.is_loaded,
            "model_type": self.model_type,
            "device": self.device,
            "torch_dtype": str(self.torch_dtype),
            "current_scheduler": self.current_scheduler,
            "base_model": settings.base_model,
            "model_path": settings.model_path,
            "available_models": list(self.available_models.keys()),
            "available_schedulers": list(self.schedulers.keys()),
            "loaded_pipelines": {
                "standard": self.pipeline is not None,
                "sdxl": self.xl_pipeline is not None,
                "img2img": self.img2img_pipeline is not None,
                "inpaint": self.inpaint_pipeline is not None,
                "controlnet": self.controlnet_pipeline is not None
            },
            "optimizations": {
                "xformers_enabled": getattr(settings, 'enable_xformers', False) and is_xformers_available(),
                "attention_slicing": getattr(settings, 'enable_attention_slicing', True),
                "cpu_offload": self.enable_cpu_offload,
                "torch_compile": self.use_torch_compile,
                "compel_enabled": self.use_compel and self.compel is not None
            },
            "generation_modes": ["text2img", "img2img", "inpaint"],
            "cache_stats": self.get_cache_stats()
        }

    def unload_model(self):
        """Unload all models and free memory."""
        pipelines = [
            ("pipeline", self.pipeline),
            ("xl_pipeline", self.xl_pipeline),
            ("controlnet_pipeline", self.controlnet_pipeline),
            ("img2img_pipeline", self.img2img_pipeline),
            ("inpaint_pipeline", self.inpaint_pipeline)
        ]

        for name, pipeline in pipelines:
            if pipeline is not None:
                del pipeline
                setattr(self, name, None)

        if self.compel is not None:
            del self.compel
            self.compel = None

        if self.xl_compel is not None:
            del self.xl_compel
            self.xl_compel = None

        self.is_loaded = False
        cleanup_memory()
        logger.info("All models unloaded and memory cleaned")

    def switch_model(self, model_variant: str) -> bool:
        """Switch to a different model variant."""
        try:
            logger.info(f"Switching to model variant: {model_variant}")
            self.unload_model()
            return self.load_model(model_variant=model_variant)
        except Exception as e:
            logger.error(f"Failed to switch model: {e}")
            return False


# Create global instance with advanced features
image_generator = AdvancedImageGenerator()
