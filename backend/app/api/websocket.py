import json
import logging
import asyncio
from typing import Dict, Set, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
import socketio
from ..utils.job_queue import job_queue
from ..models.image_generator import image_generator
from ..config import settings

logger = logging.getLogger(__name__)

# Create Socket.IO server
sio = socketio.AsyncServer(
    cors_allowed_origins="*",
    logger=True,
    engineio_logger=True
)

# Connection management
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_rooms: Dict[str, Set[str]] = {}
        self.room_users: Dict[str, Set[str]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")

    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        # Remove from all rooms
        if client_id in self.user_rooms:
            for room in self.user_rooms[client_id]:
                if room in self.room_users:
                    self.room_users[room].discard(client_id)
            del self.user_rooms[client_id]
        logger.info(f"Client {client_id} disconnected")

    async def send_personal_message(self, message: dict, client_id: str):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")

    async def broadcast_to_room(self, message: dict, room: str):
        if room in self.room_users:
            for client_id in self.room_users[room]:
                await self.send_personal_message(message, client_id)

    async def broadcast_to_all(self, message: dict):
        for client_id in self.active_connections:
            await self.send_personal_message(message, client_id)

    def join_room(self, client_id: str, room: str):
        if client_id not in self.user_rooms:
            self.user_rooms[client_id] = set()
        if room not in self.room_users:
            self.room_users[room] = set()

        self.user_rooms[client_id].add(room)
        self.room_users[room].add(client_id)

    def leave_room(self, client_id: str, room: str):
        if client_id in self.user_rooms:
            self.user_rooms[client_id].discard(room)
        if room in self.room_users:
            self.room_users[room].discard(client_id)

manager = ConnectionManager()

# Socket.IO event handlers
@sio.event
async def connect(sid, environ):
    logger.info(f"Socket.IO client {sid} connected")
    await sio.emit('system:status', {
        'isOnline': True,
        'modelLoaded': image_generator.is_loaded,
        'queueLength': len(job_queue.jobs) if hasattr(job_queue, 'jobs') else 0
    }, room=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Socket.IO client {sid} disconnected")

@sio.event
async def join(sid, data):
    room = data.get('room')
    if room:
        await sio.enter_room(sid, room)
        logger.info(f"Client {sid} joined room {room}")

@sio.event
async def leave(sid, data):
    room = data.get('room')
    if room:
        await sio.leave_room(sid, room)
        logger.info(f"Client {sid} left room {room}")

@sio.event
async def generation_start(sid, data):
    """Handle generation start request"""
    try:
        job_id = data.get('jobId')
        params = data.get('params')
        priority = data.get('priority', 1)

        if not job_id or not params:
            await sio.emit('generation:failed', {
                'jobId': job_id,
                'error': 'Missing jobId or params'
            }, room=sid)
            return

        # Join generation room for updates
        await sio.enter_room(sid, f"generation:{job_id}")

        # Emit generation started
        await sio.emit('generation:started', {
            'jobId': job_id,
            'estimatedTime': params.get('num_inference_steps', 20) * 2000  # Rough estimate
        }, room=f"generation:{job_id}")

        # Start generation process (this would be handled by the job queue)
        # For now, simulate progress
        asyncio.create_task(simulate_generation_progress(job_id, params))

    except Exception as e:
        logger.error(f"Error starting generation: {e}")
        await sio.emit('generation:failed', {
            'jobId': data.get('jobId'),
            'error': str(e)
        }, room=sid)

@sio.event
async def generation_cancel(sid, data):
    """Handle generation cancellation"""
    job_id = data.get('jobId')
    if job_id:
        # Cancel the job (implementation depends on job queue)
        await sio.emit('generation:cancelled', {
            'jobId': job_id
        }, room=f"generation:{job_id}")

# Simulation function for demo purposes
async def simulate_generation_progress(job_id: str, params: dict):
    """Simulate generation progress for demo"""
    try:
        total_steps = params.get('num_inference_steps', 20)

        for step in range(total_steps + 1):
            progress = (step / total_steps) * 100
            eta = (total_steps - step) * 2000  # 2 seconds per step estimate

            await sio.emit('generation:progress', {
                'jobId': job_id,
                'progress': progress,
                'step': step,
                'totalSteps': total_steps,
                'eta': eta
            }, room=f"generation:{job_id}")

            await asyncio.sleep(2)  # Simulate processing time

        # Simulate completion
        await sio.emit('generation:completed', {
            'jobId': job_id,
            'result': {
                'success': True,
                'image': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                'metadata': {
                    'generation_time': total_steps * 2,
                    'steps': total_steps,
                    'model': 'demo'
                }
            }
        }, room=f"generation:{job_id}")

    except Exception as e:
        logger.error(f"Error in generation simulation: {e}")
        await sio.emit('generation:failed', {
            'jobId': job_id,
            'error': str(e)
        }, room=f"generation:{job_id}")

# Legacy WebSocket router for backward compatibility
ws_router = APIRouter()

@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = f"ws_{id(websocket)}"
    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive_text()

            try:
                msg = json.loads(data)
            except Exception:
                await manager.send_personal_message({
                    "type": "error",
                    "error": "invalid_json"
                }, client_id)
                continue

            # Handle different message types
            msg_type = msg.get("type")

            if msg_type == "subscribe" and msg.get("job_id"):
                job_id = msg["job_id"]
                manager.join_room(client_id, f"generation:{job_id}")

                # Send current status
                status = job_queue.status(job_id) if hasattr(job_queue, 'status') else {"status": "unknown"}
                await manager.send_personal_message({
                    "type": "status",
                    "job": status
                }, client_id)

            elif msg_type == "join_room":
                room = msg.get("room")
                if room:
                    manager.join_room(client_id, room)

            elif msg_type == "leave_room":
                room = msg.get("room")
                if room:
                    manager.leave_room(client_id, room)

            else:
                await manager.send_personal_message({
                    "type": "error",
                    "error": "unsupported_message"
                }, client_id)

    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)

