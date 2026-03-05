# FlowMind Backend

FastAPI + PostgreSQL backend for the FlowMind agentic workflow builder.

## Quick Start

### 1. Prerequisites
- Python 3.11+
- PostgreSQL 14+ running locally
- A database named `flowmind`

```sql
CREATE DATABASE flowmind;
```

### 2. Install dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and OPENAI_API_KEY
```

### 4. Run migrations

```bash
alembic upgrade head
```

### 5. Start the server

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

## Project Structure

```
app/
├── main.py              # FastAPI app, CORS, WebSocket endpoint, lifespan
├── config.py            # Pydantic settings from .env
├── database.py          # Async SQLAlchemy engine + session + Base
│
├── models/              # ORM table definitions
├── schemas/             # Pydantic request/response models
├── routers/             # FastAPI route handlers
├── services/            # Business logic
│   └── executor/        # Workflow execution engine
└── core/                # Shared utilities (exceptions, WebSocket manager)
```

## WebSocket Usage

Connect to `ws://localhost:8000/ws/executions/{execution_id}` after triggering
a run to receive live updates:

```json
{ "type": "node_update", "node_id": "...", "status": "running", "output": null }
{ "type": "node_update", "node_id": "...", "status": "completed", "output": {...} }
{ "type": "execution_update", "status": "completed", "output": {...} }
```

## Running with Docker (optional)

```bash
docker run --name flowmind-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=flowmind \
  -p 5432:5432 -d postgres:16
```
