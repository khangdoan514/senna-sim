from fastapi import APIRouter, HTTPException, Query
from app.core.state import replay_service, telemetry_service
from app.models.schemas import SessionLoadRequest
import numpy as np

# session.py

router = APIRouter(prefix="/api/simulation", tags=["session"])

def convert_native(obj):
    if isinstance(obj, np.integer):
        return int(obj)
    
    if isinstance(obj, np.floating):
        return float(obj)
    
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    
    if isinstance(obj, dict):
        return {k: convert_native(v) for k, v in obj.items()}
    
    if isinstance(obj, list):
        return [convert_native(v) for v in obj]
    
    return obj

@router.post("/load-session")
async def load_session(payload: SessionLoadRequest):
    try:
        data = telemetry_service.load_session(
            year=payload.year,
            round_number=payload.round_number,
            session_type=payload.session_type,
            refresh=payload.refresh,
        )

        replay_service.set_total_frames(data.get("total_frames", 0))
        return convert_native({"status": "loaded", **data})
    
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

@router.get("/ref-lap-profile")
async def ref_lap_profile(
    year: int = Query(..., ge=2000, le=2100),
    round_number: int = Query(..., ge=1, le=30),
    session_type: str = Query("R"),
    num_samples: int = Query(480, ge=32, le=2048),
):
    # Fastest lap from FastF1
    try:
        data = telemetry_service.get_ref_lap_profile(
            year=year,
            round_number=round_number,
            session_type=session_type,
            num_samples=num_samples,
        )
        return convert_native({"status": "ok", **data})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/sessions/{year}")
async def list_sessions(year: int):
    try:
        rounds = telemetry_service.list_rounds(year)
        return {"year": year, "rounds": rounds}
    
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

