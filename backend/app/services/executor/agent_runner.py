import re
import json
import httpx
from app.config import settings
from app.core.exceptions import ExecutionError
import logging

logger = logging.getLogger(__name__)

MODEL_ALIASES = {
    # High capability (250k token tier)
    "gpt-5.2":        "gpt-5.2",
    "o3":             "o3",

    # High volume (2.5M token tier)
    "gpt-5-mini":     "gpt-5-mini",
    "o3-mini":        "o3-mini",
    "gpt-4.1-mini":   "gpt-4.1-mini",
    "gpt-4o-mini":    "gpt-4o-mini",
}


def _interpolate(template: str, data: dict) -> str:
    """Replace {{variable}} placeholders with values from data dict."""
    def replacer(match):
        key  = match.group(1).strip()
        parts = key.split(".")
        val  = data
        for part in parts:
            if isinstance(val, dict):
                val = val.get(part, "")
            else:
                val = ""
                break
        return str(val) if val is not None else ""

    return re.sub(r"\{\{(.+?)\}\}", replacer, template)


def _build_messages_from_history(history: list, system_prompt: str) -> list:
    """Convert conversation history array into OpenAI message format."""
    messages = [{"role": "system", "content": system_prompt}]
    for entry in history:
        role    = entry.get("role", "user")
        content = entry.get("content") or ""
        if content and role in ("user", "assistant"):
            messages.append({"role": role, "content": str(content)})
    return messages


class AgentRunner:
    async def run(self, config: dict, input_data: dict) -> dict:
        logger.info(f"[AGENT] config={config}")
        system_prompt   = config.get("systemPrompt", "You are a helpful assistant.")
        prompt_template = config.get("prompt", "")
        temperature     = float(config.get("temperature", 0.7))
        max_tokens      = int(config.get("maxTokens", 1000))
        model_key       = config.get("model", "gpt-4o-mini")
        model           = MODEL_ALIASES.get(model_key, model_key)

        # ── Build the user message ────────────────────────────
        # Priority: explicit prompt template > raw message from input
        history: list  = input_data.get("history", [])
        raw_message: str = input_data.get("message", "")

        if prompt_template.strip():
            # Template can reference {{message}}, {{history}}, etc.
            user_message = _interpolate(prompt_template, input_data)
        elif raw_message:
            user_message = raw_message
        else:
            # Last resort: stringify the whole input
            user_message = json.dumps(input_data, default=str)

        logger.info(f"[AGENT] model={model} system={system_prompt[:80]!r}")
        logger.info(f"[AGENT] user_message={user_message[:200]!r}")
        logger.info(f"[AGENT] history_len={len(history)}")

        # ── Mock mode (no API key) ────────────────────────────
        if not settings.OPENAI_API_KEY:
            mock_reply = (
                f"[Mock Agent — no API key set]\n\n"
                f"I received your message: \"{user_message}\"\n\n"
                f"Conversation has {len(history)} previous message(s).\n"
                f"To get real responses, set OPENAI_API_KEY in your .env file."
            )
            logger.info(f"[AGENT] Returning mock response (no API key)")
            return {"output": mock_reply, "model": model, "mock": True}

        # ── Build message array ───────────────────────────────
        # If we have conversation history, thread it properly
        if history and len(history) > 1:
            messages = _build_messages_from_history(history, system_prompt)
            # If the last history entry is the current user message, don't duplicate
            last = messages[-1] if messages else {}
            if not (last.get("role") == "user" and last.get("content") == user_message):
                messages.append({"role": "user", "content": user_message})
        else:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ]

        logger.info(f"[AGENT] Sending {len(messages)} messages to {model}")

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.OPENAI_BASE_URL}/chat/completions",
                    headers={
                        "Authorization":  f"Bearer {settings.OPENAI_API_KEY}",
                        "Content-Type":   "application/json",
                    },
                    json={
                        "model":       model,
                        "messages":    messages,
                        #"temperature": temperature,
                        "max_completion_tokens":  max_tokens,
                    },
                )
                response.raise_for_status()
                data = response.json()

        except httpx.TimeoutException:
            raise ExecutionError("Agent request timed out after 60 seconds")
        except httpx.HTTPStatusError as e:
            raise ExecutionError(
                f"Agent API error {e.response.status_code}: {e.response.text[:300]}"
            )

        content = data["choices"][0]["message"]["content"]
        usage   = data.get("usage", {})

        logger.info(f"[AGENT] Response received ({len(content)} chars): {content[:200]!r}")

        return {
            "output":  content,
            "model":   model,
            "usage": {
                "prompt_tokens":     usage.get("prompt_tokens", 0),
                "completion_tokens": usage.get("completion_tokens", 0),
            },
        }
