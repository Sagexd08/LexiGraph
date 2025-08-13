"""
Hugging Face Spaces Gradio App for Lexigraph

Provides a Gradio interface for the Lexigraph text-to-image generation system.
Optimized for Hugging Face Spaces deployment with GPU support.
"""

import os
import sys
import logging
import gradio as gr
import torch
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from backend.app.models.image_generator import ImageGenerator
from backend.app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize image generator
image_generator = ImageGenerator()

# Load model on startup
try:
    success = image_generator.load_model()
    if success:
        logger.info("Model loaded successfully")
    else:
        logger.error("Failed to load model")
except Exception as e:
    logger.error(f"Error loading model: {e}")

def generate_image(
    prompt: str,
    negative_prompt: str = "",
    width: int = 512,
    height: int = 512,
    num_inference_steps: int = 20,
    guidance_scale: float = 7.5,
    seed: int = -1,
    style: str = "None"
) -> tuple:
    """
    Generate an image from a text prompt.
    
    Returns:
        tuple: (generated_image, metadata_text)
    """
    try:
        if not prompt.strip():
            return None, "Please enter a prompt"
        
        # Handle random seed
        if seed == -1:
            seed = None
        
        # Apply style if selected
        style_value = None if style == "None" else style.lower()
        
        # Generate image
        result = image_generator.generate_image(
            prompt=prompt,
            negative_prompt=negative_prompt if negative_prompt.strip() else None,
            width=width,
            height=height,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            seed=seed,
            style=style_value
        )
        
        if result["success"]:
            # Convert base64 to PIL Image for Gradio
            import base64
            import io
            from PIL import Image
            
            image_data = result["image"].split(",")[1]
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Create metadata text
            metadata = result["metadata"]
            metadata_text = f"""
**Generation Details:**
- Prompt: {metadata['prompt']}
- Negative Prompt: {metadata.get('negative_prompt', 'None')}
- Resolution: {metadata['width']}×{metadata['height']}
- Steps: {metadata['num_inference_steps']}
- Guidance Scale: {metadata['guidance_scale']}
- Seed: {metadata.get('seed', 'Random')}
- Style: {metadata.get('style', 'None')}
- Scheduler: {metadata['scheduler']}
- Model: {metadata['model_type']}
- Generation Time: {result.get('generation_time', 'N/A')}s
            """.strip()
            
            return image, metadata_text
        else:
            return None, f"Generation failed: {result.get('error', 'Unknown error')}"
            
    except Exception as e:
        logger.error(f"Error generating image: {e}")
        return None, f"Error: {str(e)}"

def get_model_info():
    """Get model information for display."""
    try:
        info = image_generator.get_model_info()
        return f"""
**Model Information:**
- Status: {'Loaded' if info['is_loaded'] else 'Not Loaded'}
- Type: {info['model_type']}
- Device: {info['device']}
- Base Model: {info['base_model']}
- Scheduler: {info['current_scheduler']}
- xFormers: {'Enabled' if info['optimizations']['xformers_enabled'] else 'Disabled'}
- Attention Slicing: {'Enabled' if info['optimizations']['attention_slicing'] else 'Disabled'}
- CPU Offload: {'Enabled' if info['optimizations']['cpu_offload'] else 'Disabled'}
        """.strip()
    except Exception as e:
        return f"Error getting model info: {str(e)}"

# Create Gradio interface
with gr.Blocks(
    title="Lexigraph - Text-to-Image Generation",
    theme=gr.themes.Soft(),
    css="""
    .gradio-container {
        max-width: 1200px !important;
    }
    .generate-btn {
        background: linear-gradient(45deg, #3b82f6, #8b5cf6) !important;
        border: none !important;
        color: white !important;
    }
    """
) as demo:
    
    gr.Markdown("""
    # 🎨 Lexigraph - Text-to-Image Generation
    
    Transform your ideas into stunning images using custom-trained Stable Diffusion models.
    
    **Features:**
    - Custom fine-tuned models (DreamBooth/LoRA)
    - Multiple style presets
    - Advanced parameter controls
    - High-quality image generation
    """)
    
    with gr.Row():
        with gr.Column(scale=1):
            # Input controls
            prompt = gr.Textbox(
                label="Prompt",
                placeholder="Describe the image you want to generate...",
                lines=3,
                max_lines=5
            )
            
            negative_prompt = gr.Textbox(
                label="Negative Prompt",
                placeholder="What to avoid in the image...",
                lines=2,
                value="low quality, blurry, distorted"
            )
            
            style = gr.Dropdown(
                label="Style Preset",
                choices=["None", "Realistic", "Artistic", "Anime", "Portrait", "Landscape"],
                value="None"
            )
            
            with gr.Row():
                width = gr.Slider(
                    label="Width",
                    minimum=256,
                    maximum=1024,
                    step=64,
                    value=512
                )
                height = gr.Slider(
                    label="Height",
                    minimum=256,
                    maximum=1024,
                    step=64,
                    value=512
                )
            
            with gr.Accordion("Advanced Settings", open=False):
                num_inference_steps = gr.Slider(
                    label="Inference Steps",
                    minimum=1,
                    maximum=100,
                    step=1,
                    value=20
                )
                
                guidance_scale = gr.Slider(
                    label="Guidance Scale",
                    minimum=1.0,
                    maximum=20.0,
                    step=0.5,
                    value=7.5
                )
                
                seed = gr.Number(
                    label="Seed (-1 for random)",
                    value=-1,
                    precision=0
                )
            
            generate_btn = gr.Button(
                "🎨 Generate Image",
                variant="primary",
                elem_classes=["generate-btn"]
            )
        
        with gr.Column(scale=2):
            # Output
            output_image = gr.Image(
                label="Generated Image",
                type="pil",
                height=512
            )
            
            metadata_output = gr.Markdown(
                label="Generation Details",
                value="Generate an image to see details here."
            )
    
    # Model information
    with gr.Accordion("Model Information", open=False):
        model_info = gr.Markdown(get_model_info())
        refresh_info_btn = gr.Button("Refresh Model Info")
        refresh_info_btn.click(
            fn=get_model_info,
            outputs=model_info
        )
    
    # Examples
    gr.Examples(
        examples=[
            ["A beautiful sunset over a mountain lake", "", "Landscape", 512, 512, 20, 7.5, -1],
            ["Portrait of a wise old wizard with a long beard", "low quality, blurry", "Portrait", 512, 512, 25, 8.0, -1],
            ["Futuristic city with flying cars and neon lights", "low quality, blurry, distorted", "Artistic", 768, 512, 30, 7.5, -1],
            ["Cute anime girl with blue hair and big eyes", "realistic, photographic", "Anime", 512, 768, 20, 7.5, -1],
        ],
        inputs=[prompt, negative_prompt, style, width, height, num_inference_steps, guidance_scale, seed],
        outputs=[output_image, metadata_output],
        fn=generate_image,
        cache_examples=False
    )
    
    # Connect generate button
    generate_btn.click(
        fn=generate_image,
        inputs=[
            prompt,
            negative_prompt,
            width,
            height,
            num_inference_steps,
            guidance_scale,
            seed,
            style
        ],
        outputs=[output_image, metadata_output],
        show_progress=True
    )

# Launch configuration
if __name__ == "__main__":
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        show_error=True,
        quiet=False
    )
