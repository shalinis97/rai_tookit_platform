import asyncio
import json
from collections import defaultdict
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections keyed by execution_id.
    Allows the execution engine to stream live status updates
    to all clients watching a given execution.
    """

    def __init__(self):
        # execution_id (str) -> list of active WebSocket connections
        self._connections: dict[str, list[WebSocket]] = defaultdict(list)
        self._lock = asyncio.Lock()

    async def connect(self, execution_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[execution_id].append(websocket)
        logger.info(f"WS connected: execution={execution_id}")

    async def disconnect(self, execution_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            conns = self._connections.get(execution_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(execution_id, None)
        logger.info(f"WS disconnected: execution={execution_id}")

    async def broadcast(self, execution_id: str, message: dict) -> None:
        """Send a JSON message to all clients watching this execution."""
        async with self._lock:
            conns = list(self._connections.get(execution_id, []))

        if not conns:
            return

        dead: list[WebSocket] = []
        payload = json.dumps(message, default=str)

        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception as e:
                logger.warning(f"WS send failed: {e}")
                dead.append(ws)

        # Clean up dead connections
        if dead:
            async with self._lock:
                for ws in dead:
                    try:
                        self._connections[execution_id].remove(ws)
                    except ValueError:
                        pass

    async def send_to(self, execution_id: str, websocket: WebSocket, message: dict) -> None:
        """Send a message to a single WebSocket client."""
        try:
            await websocket.send_text(json.dumps(message, default=str))
        except Exception as e:
            logger.warning(f"WS single send failed: {e}")
            await self.disconnect(execution_id, websocket)


# Singleton instance used across the app
ws_manager = WebSocketManager()
