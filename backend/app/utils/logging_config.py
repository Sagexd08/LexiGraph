"""
Logging configuration for Lexigraph Backend

Provides centralized logging setup with file rotation, structured logging,
and different log levels for various components.
"""

import logging
import logging.handlers
import sys
from pathlib import Path
from typing import Optional


def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    max_file_size: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5,
    enable_console: bool = True
) -> logging.Logger:
    """
    Setup comprehensive logging configuration.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (optional)
        max_file_size: Maximum log file size in bytes before rotation
        backup_count: Number of backup log files to keep
        enable_console: Whether to enable console logging
        
    Returns:
        Configured logger instance
    """
    
    # Create logs directory if it doesn't exist
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Clear any existing handlers
    root_logger.handlers = []
    
    # Create formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, log_level.upper()))
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)
    
    # File handler with rotation
    if log_file:
        file_handler = logging.handlers.RotatingFileHandler(
            filename=log_file,
            maxBytes=max_file_size,
            backupCount=backup_count,
            encoding='utf-8'
        )
        file_handler.setLevel(getattr(logging, log_level.upper()))
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    
    # Set specific logger levels to reduce noise
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("diffusers").setLevel(logging.WARNING)
    logging.getLogger("transformers").setLevel(logging.WARNING)
    logging.getLogger("torch").setLevel(logging.WARNING)
    logging.getLogger("PIL").setLevel(logging.WARNING)
    
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured - Level: {log_level}, File: {log_file}")
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Logger name
        
    Returns:
        Logger instance
    """
    return logging.getLogger(name)


class RequestLoggerMixin:
    """Mixin class for adding request logging capabilities."""
    
    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)
    
    def log_request(self, method: str, path: str, status_code: int, duration: float):
        """Log an HTTP request with timing information."""
        self.logger.info(f"{method} {path} - {status_code} ({duration:.3f}s)")
    
    def log_error(self, error: Exception, context: str = ""):
        """Log an error with context information."""
        self.logger.error(f"Error in {context}: {str(error)}", exc_info=True)


class ModelLoggerMixin:
    """Mixin class for adding model operation logging."""
    
    def __init__(self):
        self.logger = get_logger(self.__class__.__name__)
    
    def log_model_load(self, model_path: str, device: str, success: bool):
        """Log model loading operation."""
        status = "SUCCESS" if success else "FAILED"
        self.logger.info(f"Model load {status}: {model_path} on {device}")
    
    def log_generation(self, prompt: str, duration: float, success: bool):
        """Log image generation operation."""
        status = "SUCCESS" if success else "FAILED"
        self.logger.info(f"Generation {status}: '{prompt[:50]}...' ({duration:.2f}s)")
    
    def log_memory_usage(self, gpu_memory: float, system_memory: float):
        """Log memory usage statistics."""
        self.logger.debug(f"Memory usage - GPU: {gpu_memory:.1f}GB, System: {system_memory:.1f}GB")


# Pre-configured loggers for common use cases
api_logger = get_logger("lexigraph.api")
model_logger = get_logger("lexigraph.model")
training_logger = get_logger("lexigraph.training")
dataset_logger = get_logger("lexigraph.dataset")
