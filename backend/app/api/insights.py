from fastapi import APIRouter, Query
from app.core.state import insights_service, replay_service, telemetry_service

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.get("/driver")
async def driver_insight(driver: str = Query(..., min_length=2, max_length=3)):
    state = replay_service.snapshot()
    frame = telemetry_service.get_frame(int(state["current_frame"])) if state["total_frames"] else None
    return insights_service.build_driver_insight(frame, driver.upper())

@router.get("/track")
async def track_positions():
    state = replay_service.snapshot()
    frame = telemetry_service.get_frame(int(state["current_frame"])) if state["total_frames"] else None
    return insights_service.build_track_positions(frame)
