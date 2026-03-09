"""
Proxy endpoint for AI Assistant — uses OpenAI GPT.
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
    if not settings.OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")

    # Build messages with system prompt prepended
    messages = [{"role": "system", "content": req.system}]
    messages += [m.model_dump() for m in req.messages]

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{settings.OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                    "Content-Type":  "application/json",
                },
                json={
                    "model":              "gpt-5-mini",
                    #"max_completion_tokens": req.max_tokens,
                    "messages":           messages,
                },
            )
            response.raise_for_status()
            data = response.json()
            text = data["choices"][0]["message"]["content"]
            return {"content": text}

    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text[:300])
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="AI request timed out")
    

