from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime

app = FastAPI(title="RAI Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
use_cases_db: dict = {}
agents_db: dict = {}
policies_db: dict = {}


# --- Models ---

class Section(BaseModel):
    id: Optional[str] = None
    title: str
    content: str


class UseCaseCreate(BaseModel):
    name: str
    description: str
    sections: List[Section] = []


class AgentCreate(BaseModel):
    name: str
    description: str
    use_case_id: Optional[str] = None


class PolicyCreate(BaseModel):
    name: str
    description: str


# --- Use Cases ---

@app.get("/api/use-cases")
def list_use_cases():
    return list(use_cases_db.values())


@app.post("/api/use-cases", status_code=201)
def create_use_case(payload: UseCaseCreate):
    uc_id = str(uuid.uuid4())
    sections = [
        {"id": str(uuid.uuid4()), "title": s.title, "content": s.content}
        for s in payload.sections
    ]
    uc = {
        "id": uc_id,
        "name": payload.name,
        "description": payload.description,
        "sections": sections,
        "created_at": datetime.utcnow().isoformat(),
    }
    use_cases_db[uc_id] = uc
    return uc


@app.get("/api/use-cases/{uc_id}")
def get_use_case(uc_id: str):
    if uc_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    return use_cases_db[uc_id]


@app.put("/api/use-cases/{uc_id}")
def update_use_case(uc_id: str, payload: UseCaseCreate):
    if uc_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    sections = [
        {"id": s.id or str(uuid.uuid4()), "title": s.title, "content": s.content}
        for s in payload.sections
    ]
    use_cases_db[uc_id].update(
        {"name": payload.name, "description": payload.description, "sections": sections}
    )
    return use_cases_db[uc_id]


@app.delete("/api/use-cases/{uc_id}")
def delete_use_case(uc_id: str):
    if uc_id not in use_cases_db:
        raise HTTPException(status_code=404, detail="Use case not found")
    del use_cases_db[uc_id]
    return {"message": "Deleted"}


# --- Agents ---

@app.get("/api/agents")
def list_agents():
    return list(agents_db.values())


@app.post("/api/agents", status_code=201)
def create_agent(payload: AgentCreate):
    agent_id = str(uuid.uuid4())
    agent = {
        "id": agent_id,
        "name": payload.name,
        "description": payload.description,
        "use_case_id": payload.use_case_id,
        "created_at": datetime.utcnow().isoformat(),
    }
    agents_db[agent_id] = agent
    return agent


@app.get("/api/agents/{agent_id}")
def get_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agents_db[agent_id]


@app.put("/api/agents/{agent_id}")
def update_agent(agent_id: str, payload: AgentCreate):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    agents_db[agent_id].update(
        {
            "name": payload.name,
            "description": payload.description,
            "use_case_id": payload.use_case_id,
        }
    )
    return agents_db[agent_id]


@app.delete("/api/agents/{agent_id}")
def delete_agent(agent_id: str):
    if agent_id not in agents_db:
        raise HTTPException(status_code=404, detail="Agent not found")
    del agents_db[agent_id]
    return {"message": "Deleted"}


# --- Policies ---

@app.get("/api/policies")
def list_policies():
    return list(policies_db.values())


@app.post("/api/policies", status_code=201)
def create_policy(payload: PolicyCreate):
    policy_id = str(uuid.uuid4())
    policy = {
        "id": policy_id,
        "name": payload.name,
        "description": payload.description,
        "created_at": datetime.utcnow().isoformat(),
    }
    policies_db[policy_id] = policy
    return policy


@app.put("/api/policies/{policy_id}")
def update_policy(policy_id: str, payload: PolicyCreate):
    if policy_id not in policies_db:
        raise HTTPException(status_code=404, detail="Policy not found")
    policies_db[policy_id].update({"name": payload.name, "description": payload.description})
    return policies_db[policy_id]


@app.delete("/api/policies/{policy_id}")
def delete_policy(policy_id: str):
    if policy_id not in policies_db:
        raise HTTPException(status_code=404, detail="Policy not found")
    del policies_db[policy_id]
    return {"message": "Deleted"}
