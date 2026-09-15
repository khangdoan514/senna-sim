from typing import Any, Dict, Optional

class InsightsService:
    def build_driver_insight(self, frame: Optional[Dict[str, Any]], driver_code: str) -> Dict[str, Any]:
        if not frame:
            return {"driver": driver_code, "telemetry": None}
        
        driver_data = (frame.get("drivers") or {}).get(driver_code)
        if not driver_data:
            return {"driver": driver_code, "telemetry": None}
        
        throttle = float(driver_data.get("throttle", 0.0))
        brake = float(driver_data.get("brake", 0.0))
        speed = float(driver_data.get("speed", 0.0))
        gear = int(driver_data.get("gear", 0))
        drs = int(driver_data.get("drs", 0))
        tyre_life = float(driver_data.get("tyre_life", 0.0))
        estimated_degradation = min(100.0, tyre_life * 2.8)
        return {
            "driver": driver_code,
            "telemetry": {
                "speed": speed,
                "gear": gear,
                "throttle": throttle,
                "brake": brake,
                "drs": drs,
                "tyre_life": tyre_life,
                "estimated_degradation": round(estimated_degradation, 2),
            },
        }

    def build_track_positions(self, frame: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        if not frame:
            return {"drivers": []}
        
        drivers = frame.get("drivers", {})
        payload = []
        for code, values in drivers.items():
            payload.append(
                {
                    "code": code,
                    "x": values.get("x"),
                    "y": values.get("y"),
                    "lap": values.get("lap"),
                    "position": values.get("position"),
                }
            )

        payload.sort(key=lambda item: (item.get("position") is None, item.get("position", 99)))
        return {"drivers": payload}