from fastapi import APIRouter, HTTPException
from app.core.state import telemetry_service

# qualify.py

router = APIRouter(prefix="/api/qualifying", tags=["qualifying"])

@router.get("/summary")
async def qualifying_summary():
    data = telemetry_service.qualifying_data
    if not data:
        raise HTTPException(status_code=404, detail="No qualifying session loaded")
    
    return data

@router.get("/driver/{driver_code}/{segment}")
async def qualifying_driver_segment(driver_code: str, segment: str):
    data = telemetry_service.qualifying_data
    if not data:
        raise HTTPException(status_code=404, detail="No qualifying session loaded")
    
    telemetry = data.get("telemetry", {})
    driver_data = telemetry.get(driver_code.upper())
    if not driver_data:
        raise HTTPException(status_code=404, detail=f"Driver {driver_code} not found")
    
    segment_data = driver_data.get("segments", {}).get(segment.upper())
    if segment_data is None:
        raise HTTPException(status_code=404, detail=f"Segment {segment} not found")
    
    return {"driver": driver_code.upper(), "segment": segment.upper(), "frames": segment_data}
