const BASE = 'http://localhost:8000/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// Use Cases
export const getUseCases = () => request('/use-cases');
export const createUseCase = (data) => request('/use-cases', { method: 'POST', body: JSON.stringify(data) });
export const updateUseCase = (id, data) => request(`/use-cases/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUseCase = (id) => request(`/use-cases/${id}`, { method: 'DELETE' });

// Agents
export const getAgents = () => request('/agents');
export const createAgent = (data) => request('/agents', { method: 'POST', body: JSON.stringify(data) });
export const updateAgent = (id, data) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAgent = (id) => request(`/agents/${id}`, { method: 'DELETE' });

// Policies
export const getPolicies = () => request('/policies');
export const createPolicy = (data) => request('/policies', { method: 'POST', body: JSON.stringify(data) });
export const updatePolicy = (id, data) => request(`/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deletePolicy = (id) => request(`/policies/${id}`, { method: 'DELETE' });
