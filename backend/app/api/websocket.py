import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..utils.job_queue import job_queue

logger = logging.getLogger(__name__)

ws_router = APIRouter()

@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # Expect messages like: {"type":"subscribe","job_id":"..."}
            try:
                msg = json.loads(data)
            except Exception:
                await websocket.send_text(json.dumps({"type":"error","error":"invalid_json"}))
                continue
            if msg.get("type") == "subscribe" and msg.get("job_id"):
                job_id = msg["job_id"]
                # Simple polling-based progress feed
                # In a real impl, store websocket in a map and push updates from queue
                status = job_queue.status(job_id) or {"status":"unknown"}
                await websocket.send_text(json.dumps({"type":"status","job":status}))
            else:
                await websocket.send_text(json.dumps({"type":"error","error":"unsupported_message"}))
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.send_text(json.dumps({"type":"error","error":str(e)}))
        except Exception:
            pass

