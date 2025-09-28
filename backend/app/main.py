"""
Main FastAPI Application for Lexigraph Backend

Production-ready FastAPI server with comprehensive error handling,
logging, CORS support, and automatic model loading.
"""

import logging
import sys
import time
from contextlib import asynccontextmanager
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .api.routes import router
from .api.websocket import ws_router
from .utils.job_queue import job_queue
from .models.image_generator import image_generator

# Configure logging
def setup_logging():
    """Setup comprehensive logging configuration."""
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, settings.log_level.upper()),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(settings.log_file) if settings.log_file else logging.NullHandler()
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("diffusers").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)
    
    logger = logging.getLogger(__name__)
    logger.info("Logging configured successfully")
    return logger

logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    """
    # Startup
    logger.info("Starting Lexigraph Backend...")
    logger.info(f"Configuration: {settings.app_name} v{settings.app_version}")
    logger.info(f"Model type: {settings.model_type}")
    logger.info(f"Device: {settings.device}")

    # Start job queue workers if enabled
    if settings.enable_generation_queue:
        job_queue.max_concurrency = max(1, settings.max_concurrent_requests)
        await job_queue.start_workers()
        logger.info(f"Job queue started with concurrency={job_queue.max_concurrency}")

    # Load model on startup if configured
    try:
        logger.info("Loading model on startup...")
        success = image_generator.load_model()
        if success:
            logger.info("Model loaded successfully on startup")
        else:
            logger.warning("Failed to load model on startup - will load on first request")
    except Exception as e:
        logger.error(f"Error loading model on startup: {str(e)}")
        logger.info("Model will be loaded on first request")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Lexigraph Backend...")
    try:
        image_generator.unload_model()
        logger.info("Model unloaded successfully")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Production-ready text-to-image generation API using custom Stable Diffusion models",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3031", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add trusted host middleware for security
if not settings.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", settings.host]
    )

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing information."""
    start_time = time.time()
    
    # Log request
    if settings.enable_request_logging:
        logger.info(f"Request: {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    if settings.enable_request_logging:
        logger.info(f"Response: {response.status_code} - {process_time:.3f}s")
    
    # Add timing header
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Global exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with detailed error responses."""
    logger.error(f"HTTP {exc.status_code}: {exc.detail} - {request.method} {request.url.path}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "type": "HTTPException",
                "status_code": exc.status_code,
                "detail": exc.detail,
                "path": str(request.url.path),
                "method": request.method,
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors with detailed field information."""
    logger.error(f"Validation error: {exc.errors()} - {request.method} {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "type": "ValidationError",
                "status_code": 422,
                "detail": "Request validation failed",
                "errors": exc.errors(),
                "path": str(request.url.path),
                "method": request.method,
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions with error logging."""
    logger.error(f"Unexpected error: {str(exc)} - {request.method} {request.url.path}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "type": "InternalServerError",
                "status_code": 500,
                "detail": "An unexpected error occurred" if not settings.debug else str(exc),
                "path": str(request.url.path),
                "method": request.method,
                "timestamp": time.time()
            }
        }
    )

# Include API routes
app.include_router(router, prefix="/api/v1", tags=["Image Generation"])
app.include_router(ws_router, tags=["WebSocket"])


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "docs_url": "/docs" if settings.debug else "disabled",
        "api_prefix": "/api/v1",
        "endpoints": {
            "generate": "/api/v1/generate",
            "model_info": "/api/v1/model/info",
            "system_info": "/api/v1/system/info",
            "health": "/api/v1/health",
            "styles": "/api/v1/styles"
        }
    }

# Additional utility endpoints
@app.get("/version")
async def get_version():
    """Get application version information."""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "model_type": settings.model_type,
        "base_model": settings.base_model
    }

@app.get("/config")
async def get_config():
    """Get public configuration information."""
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Config endpoint only available in debug mode"
        )
    
    return {
        "app_name": settings.app_name,
        "app_version": settings.app_version,
        "model_type": settings.model_type,
        "base_model": settings.base_model,
        "device": settings.device,
        "max_concurrent_requests": settings.max_concurrent_requests,
        "default_resolution": f"{settings.default_width}x{settings.default_height}",
        "max_resolution": f"{settings.max_width}x{settings.max_height}",
        "max_steps": settings.max_steps,
        "available_styles": list(settings.style_presets.keys()),
        "optimizations": {
            "enable_xformers": settings.enable_xformers,
            "enable_cpu_offload": settings.enable_cpu_offload,
            "enable_attention_slicing": settings.enable_attention_slicing
        }
    }

def main():
    """Main function to run the application."""
    logger.info(f"Starting {settings.app_name} v{settings.app_version}")
    logger.info(f"Server will run on {settings.host}:{settings.port}")
    
    # Run the application
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
        access_log=settings.enable_request_logging,
        workers=1,  # Single worker for GPU models
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30
    )

if __name__ == "__main__":
    main()
