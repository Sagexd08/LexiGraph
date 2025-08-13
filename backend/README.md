# Lexigraph Backend - LoRA (Diffusers) and Queue/WebSocket

This backend now uses Diffusers-native LoRA adapters and provides an optional in-memory generation queue with WebSocket progress.

## LoRA usage (Diffusers-native)

- Training (outputs LoRA weights directory):
  python training/scripts/train_lora.py --config training/configs/lora_config.yaml

- Inference (load LoRA weights):
  Set in backend/.env:
    MODEL_TYPE=lora
    MODEL_PATH=training/models/lora_output   # path to directory containing LoRA weights
    BASE_MODEL=runwayml/stable-diffusion-v1-5
    LORA_SCALE=1.0

The backend will call pipeline.load_lora_weights(MODEL_PATH) and set adapters with the configured LORA_SCALE.

## Queue + WebSocket progress

- Enable queue:
  ENABLE_GENERATION_QUEUE=true
  MAX_CONCURRENT_REQUESTS=2

- Submit generation (unchanged):
  POST /api/v1/generate
  If queue is enabled, response includes {"metadata": {"job_id": "..."}}. Poll /api/v1/job/{job_id} or subscribe via WebSocket.

- WebSocket for progress:
  ws://<host>:<port>/ws
  Send: {"type":"subscribe","job_id":"<id>"}
  Receive: {"type":"status","job": {"status": "running|completed|failed", "progress": 0-100, ...}}

Notes:
- This is a lightweight in-memory queue; use a persistent queue (e.g., Redis/RQ) for production workloads.
- Progress is step-based using Diffusers callback.

