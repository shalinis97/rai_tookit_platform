# RAI Platform

A platform for managing **AI Agents**, **Use Cases**, and **Governance Policies**.

Built with a **FastAPI** backend and a **React** frontend.

---

## Project Structure

```
rai_project/
├── backend/
│   ├── main.py            FastAPI app — all REST endpoints
│   └── requirements.txt
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.js / App.css
        ├── index.js
        ├── api/
        │   └── index.js   API client functions
        └── components/
            ├── AgentsTab.js
            ├── UseCasesSection.js
            ├── AgentsSection.js
            ├── PoliciesTab.js
            ├── Modal.js
            ├── UseCaseModal.js
            ├── AgentModal.js
            ├── CertificateModal.js
            └── PolicyModal.js
```

---

## Getting Started

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`.

> **Note:** The frontend expects the backend running on `http://localhost:8000`. Both must be running simultaneously.

---

## Features

### Agents Tab

| Sub-tab | Description |
|---|---|
| **Use Cases** | Create and manage use cases. Each use case can have multiple titled sections with free-form content. |
| **Agents** | Register AI agents and optionally associate them with a use case. Each agent card has a **Certificate** button that renders a formatted registration certificate. |

### Policies Tab

Create and manage governance policies that define rules for agent operation.

---

## API Reference

All endpoints are prefixed with `/api`.

### Use Cases

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/use-cases` | List all use cases |
| `POST` | `/api/use-cases` | Create a use case |
| `GET` | `/api/use-cases/{id}` | Get a use case |
| `PUT` | `/api/use-cases/{id}` | Update a use case |
| `DELETE` | `/api/use-cases/{id}` | Delete a use case |

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List all agents |
| `POST` | `/api/agents` | Create an agent |
| `GET` | `/api/agents/{id}` | Get an agent |
| `PUT` | `/api/agents/{id}` | Update an agent |
| `DELETE` | `/api/agents/{id}` | Delete an agent |

### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/policies` | List all policies |
| `POST` | `/api/policies` | Create a policy |
| `PUT` | `/api/policies/{id}` | Update a policy |
| `DELETE` | `/api/policies/{id}` | Delete a policy |

---

## Data Models

**Use Case**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "sections": [{ "id": "uuid", "title": "string", "content": "string" }],
  "created_at": "ISO 8601"
}
```

**Agent**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "use_case_id": "uuid | null",
  "created_at": "ISO 8601"
}
```

**Policy**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "created_at": "ISO 8601"
}
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Frontend | React 18, plain CSS (Inter font) |
| Storage | In-memory (server restart clears data) |
