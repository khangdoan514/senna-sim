from app.services.insights_service import InsightsService
from app.services.replay_service import ReplayService
from app.services.stream_service import WebSocketStreamManager
from app.services.telemetry_service import TelemetryService

telemetry_service = TelemetryService()
replay_service = ReplayService()
stream_manager = WebSocketStreamManager()
insights_service = InsightsService()