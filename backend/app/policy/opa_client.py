"""
Async OPA client.
OPA runs as: opa run --server --addr :8181
"""
import hashlib
import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)

OPA_TIMEOUT = 5.0


class OPAClient:
    def __init__(self, opa_url: str = "http://localhost:8181"):
        self.base_url = opa_url.rstrip("/")
        self._uploaded: dict[str, str] = {}
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=OPA_TIMEOUT)
        return self._client

    async def evaluate(self, input_payload: dict[str, Any], policy_name: str = "flowmind") -> dict[str, Any]:
        """Evaluate input against a specific policy by its safe name."""
        safe_name = _safe(policy_name)
        url  = f"{self.base_url}/v1/data/ai/{safe_name}"
        body = {"input": input_payload}
        try:
            client = await self._get_client()
            resp   = await client.post(url, json=body)
            resp.raise_for_status()
            return resp.json().get("result", {})
        except httpx.ConnectError:
            logger.error("[OPA] Cannot connect — failing open")
            return {"allow": True, "deny": []}
        except httpx.TimeoutException:
            logger.error("[OPA] Timeout — failing open")
            return {"allow": True, "deny": []}
        except Exception as e:
            logger.error(f"[OPA] Error: {e}")
            return {"allow": True, "deny": []}

    async def upload_policy(self, rego_code: str, policy_name: str = "flowmind") -> bool:
        """
        Upload Rego to OPA only if content changed (hash cache).
        Rewrites `package ai.policies` to `package ai.{safe_name}` so each
        policy lives at its own OPA path without conflicting package names.
        """
        safe_name = _safe(policy_name)
        new_hash  = hashlib.sha256(rego_code.encode()).hexdigest()

        if self._uploaded.get(safe_name) == new_hash:
            logger.debug(f"[OPA] '{policy_name}' unchanged — skipping upload")
            return True

        # Rewrite package to match OPA storage path
        patched = rego_code.replace("package ai.policies", f"package ai.{safe_name}", 1)

        url = f"{self.base_url}/v1/policies/{safe_name}"
        try:
            client = await self._get_client()
            resp   = await client.put(url, content=patched.encode(), headers={"Content-Type": "text/plain"})
            resp.raise_for_status()
            self._uploaded[safe_name] = new_hash
            logger.info(f"[OPA] Uploaded policy '{policy_name}' as package ai.{safe_name}")
            return True
        except httpx.HTTPStatusError as e:
            logger.error(f"[OPA] Upload failed for '{policy_name}': {e.response.status_code} — {e.response.text[:300]}")
            return False
        except Exception as e:
            logger.error(f"[OPA] Upload failed for '{policy_name}': {e}")
            return False

    def invalidate(self, policy_name: str) -> None:
        self._uploaded.pop(_safe(policy_name), None)
        logger.debug(f"[OPA] Cache invalidated for '{policy_name}'")

    async def health(self) -> bool:
        try:
            client = await self._get_client()
            resp   = await client.get(f"{self.base_url}/health")
            return resp.status_code == 200
        except Exception:
            return False


def _safe(name: str) -> str:
    return name.lower().replace(" ", "_").replace("-", "_")


_opa_client: OPAClient | None = None


def get_opa_client() -> OPAClient:
    global _opa_client
    if _opa_client is None:
        from app.config import settings
        _opa_client = OPAClient(opa_url=getattr(settings, "OPA_URL", "http://localhost:8181"))
    return _opa_client
