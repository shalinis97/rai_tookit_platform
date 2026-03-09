"""
Proxy endpoint for AI Assistant (Claude) — avoids CORS issues with direct browser calls.
"""
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


class Message(BaseModel):
    role: str
    content: str


class AssistantRequest(BaseModel):
    system: str
    messages: list[Message]
    max_tokens: int = 1000


@router.post("/chat")
async def ai_chat(req: AssistantRequest):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key":         settings.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type":      "application/json",
                },
                json={
                    "model":      "claude-sonnet-4-20250514",
                    "max_tokens": req.max_tokens,
                    "system":     req.system,
                    "messages":   [m.model_dump() for m in req.messages],
                },
            )
            response.raise_for_status()
            data = response.json()
            text = "".join(b.get("text", "") for b in data.get("content", []))
            return {"content": text}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text[:300])
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI request timed out")
