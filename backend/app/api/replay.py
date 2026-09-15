

from fastapi import APIRouter
from app.core.state import replay_service, stream_manager, telemetry_service

# router.py

router = APIRouter(prefix="/api/simulation", tags=["replay"])

@router.get("/current-frame")
async def current_frame():
    state = replay_service.tick(fps=30)
    frame_index = int(state["current_frame"])
    frame_data = telemetry_service.get_frame(frame_index) if state["total_frames"] > 0 else None
    payload = {
        "frame": frame_data,
        "frame_index": frame_index,
        "total_frames": int(state["total_frames"]),
        "is_playing": bool(state["is_playing"]),
        "playback_speed": float(state["playback_speed"]),
    }

    await stream_manager.broadcast({"type": "frame", **payload})
    return payload

@router.post("/control/play")
async def play():
    replay_service.play()
    return {"status": "playing"}

@router.post("/control/pause")
async def pause():
    replay_service.pause()
    return {"status": "paused"}

@router.post("/control/restart")
async def restart():
    replay_service.restart()
    return {"status": "restarted"}

@router.post("/control/seek")
async def seek(frame: int):
    state = replay_service.seek(frame)
    return {"status": "seeked", "frame": int(state["current_frame"])}

@router.post("/control/speed")
async def set_speed(speed: float):
    state = replay_service.set_speed(speed)
    return {"status": "speed_set", "speed": float(state["playback_speed"])}
