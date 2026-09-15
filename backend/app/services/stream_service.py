import asyncio
import json
from typing import Any, Dict, Set
from fastapi import WebSocket

class WebSocketStreamManager:
    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._clients.add(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            if websocket in self._clients:
                self._clients.remove(websocket)

    async def broadcast(self, payload: Dict[str, Any]) -> None:
        encoded = json.dumps(payload, default=str)
        async with self._lock:
            clients = list(self._clients)
        
        dead: list[WebSocket] = []
        for client in clients:
            try:
                await client.send_text(encoded)
            except Exception:
                dead.append(client)
        
        if dead:
            async with self._lock:
                for ws in dead:
                    self._clients.discard(ws)
