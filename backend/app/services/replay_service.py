import time
from threading import Lock
from typing import Any, Dict

class ReplayService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._state: Dict[str, Any] = {
            "is_playing": False,
            "current_frame": 0,
            "playback_speed": 1.0,
            "total_frames": 0,
            "last_update": 0.0,
        }

    def set_total_frames(self, total_frames: int) -> None:
        with self._lock:
            self._state["total_frames"] = max(0, int(total_frames))
            self._state["current_frame"] = 0
            self._state["is_playing"] = False
            self._state["last_update"] = 0.0

    def play(self) -> Dict[str, Any]:
        with self._lock:
            self._state["is_playing"] = True
            self._state["last_update"] = time.time()
            return dict(self._state)

    def pause(self) -> Dict[str, Any]:
        with self._lock:
            self._state["is_playing"] = False
            self._state["last_update"] = 0.0
            return dict(self._state)

    def restart(self) -> Dict[str, Any]:
        with self._lock:
            self._state["current_frame"] = 0
            self._state["is_playing"] = False
            self._state["last_update"] = 0.0
            return dict(self._state)

    def seek(self, frame: int) -> Dict[str, Any]:
        with self._lock:
            max_index = max(0, self._state["total_frames"] - 1)
            self._state["current_frame"] = max(0, min(int(frame), max_index))
            self._state["last_update"] = 0.0
            return dict(self._state)

    def set_speed(self, speed: float) -> Dict[str, Any]:
        with self._lock:
            self._state["playback_speed"] = max(0.1, min(10.0, float(speed)))
            return dict(self._state)

    def snapshot(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._state)

    def tick(self, fps: int = 30) -> Dict[str, Any]:
        with self._lock:
            if not self._state["is_playing"]:
                return dict(self._state)

            now = time.time()
            if self._state["last_update"] == 0.0:
                self._state["last_update"] = now
                return dict(self._state)

            elapsed = now - self._state["last_update"]
            frames_to_advance = int(elapsed * fps * self._state["playback_speed"])
            if frames_to_advance <= 0:
                return dict(self._state)

            new_frame = self._state["current_frame"] + frames_to_advance
            if new_frame >= self._state["total_frames"]:
                self._state["current_frame"] = max(0, self._state["total_frames"] - 1)
                self._state["is_playing"] = False
                self._state["last_update"] = 0.0
            else:
                self._state["current_frame"] = new_frame
                self._state["last_update"] = now
            
            return dict(self._state)
