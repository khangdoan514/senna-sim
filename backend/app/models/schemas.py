from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class SessionLoadRequest(BaseModel):
    year: int
    round_number: int
    session_type: str = "R"
    refresh: bool = False

class ReplayControlRequest(BaseModel):
    frame: Optional[int] = None
    speed: Optional[float] = None

class SessionInfoResponse(BaseModel):
    event_name: str
    round: int
    country: str
    location: str
    date: str

class ReplayFrameResponse(BaseModel):
    frame: Optional[Dict[str, Any]]
    frame_index: int
    total_frames: int
    is_playing: bool
    playback_speed: float

class ScheduleEvent(BaseModel):
    round_number: int
    event_name: str
    date: str
    country: str
    type: Optional[str] = None

class QualifyingSummaryResponse(BaseModel):
    results: List[Dict[str, Any]]
    telemetry: Dict[str, Any]
    max_speed: float
    min_speed: float
