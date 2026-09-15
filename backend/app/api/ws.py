import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.state import replay_service, stream_manager, telemetry_service

router = APIRouter(tags=["websocket"])

@router.websocket("/ws/replay")
async def replay_ws(websocket: WebSocket):
    await stream_manager.connect(websocket)
    try:
        while True:
            state = replay_service.tick(fps=30)
            frame = telemetry_service.get_frame(int(state["current_frame"])) if state["total_frames"] else None
            await websocket.send_json(
                {
                    "type": "frame",
                    "frame": frame,
                    "frame_index": int(state["current_frame"]),
                    "total_frames": int(state["total_frames"]),
                    "is_playing": bool(state["is_playing"]),
                    "playback_speed": float(state["playback_speed"]),
                }
            )
            await asyncio.sleep(1 / 15)
    except WebSocketDisconnect:
        await stream_manager.disconnect(websocket)

    except Exception:
        await stream_manager.disconnect(websocket)