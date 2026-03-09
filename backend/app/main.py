import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables
from app.routers import workflows, nodes, edges, executions, policies, ai_assistant, files
from app.core.websocket_manager import ws_manager

logging.basicConfig(
    level=logging.INFO if settings.is_development else logging.WARNING,
    format="%(asctime)s | %(levelname)-8s | %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)



async def _seed_default_policy():
    """Load default.rego into OPA sidecar on startup."""
    import os
    from app.policy.opa_client import get_opa_client
    rego_path = os.path.join(os.path.dirname(__file__), "policy", "default.rego")
    if os.path.exists(rego_path):
        with open(rego_path) as f:
            code = f.read()
        opa = get_opa_client()
        ok = await opa.upload_policy(code, policy_name="default")
        if ok:
            logger.info("[POLICY] Default Rego policy loaded into OPA")
        else:
            logger.warning("[POLICY] Could not load default policy (OPA not running?)")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting FlowMind API...")
    if settings.is_development:
        await create_tables()
        logger.info("Database tables verified")
    await _seed_default_policy()
    yield
    # Shutdown
    logger.info("Shutting down FlowMind API")


app = FastAPI(
    title="FlowMind API",
    description="Agentic low-code workflow builder backend",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST ROUTERS ──────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(workflows.router, prefix=API_PREFIX)
app.include_router(nodes.router, prefix=API_PREFIX)
app.include_router(edges.router, prefix=API_PREFIX)
app.include_router(executions.router, prefix=API_PREFIX)
app.include_router(policies.router, prefix=API_PREFIX)
app.include_router(ai_assistant.router, prefix=API_PREFIX)
app.include_router(files.router, prefix=API_PREFIX)


# ── WEBSOCKET ─────────────────────────────────────────────────
@app.websocket("/ws/executions/{execution_id}")
async def websocket_execution(execution_id: str, websocket: WebSocket):
    """
    Connect to receive live updates for a specific execution.
    Messages are JSON objects:
      { type: "node_update",      node_id, status, output, error }
      { type: "execution_update", status, execution_id, output?, error? }
    """
    await ws_manager.connect(execution_id, websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(execution_id, websocket)


# ── HEALTH ────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/", tags=["Health"])
async def root():
    return {
        "name": "FlowMind API",
        "version": "1.0.0",
        "docs": "/docs",
    }
