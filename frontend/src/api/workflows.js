import api from './client';

export const workflowsApi = {
  list:      ()         => api.get('/workflows').then(r => r.data),
  get:       (id)       => api.get(`/workflows/${id}`).then(r => r.data),
  create:    (data)     => api.post('/workflows', data).then(r => r.data),
  update:    (id, data) => api.patch(`/workflows/${id}`, data).then(r => r.data),
  delete:    (id)       => api.delete(`/workflows/${id}`),
  duplicate: (id)       => api.post(`/workflows/${id}/duplicate`).then(r => r.data),
  batchSave: (id, data) => api.post(`/workflows/${id}/nodes/batch`, data).then(r => r.data),
};

/**
 * Convert backend node shape → frontend shape.
 * Backend uses position_x/position_y; frontend uses x/y.
 */
export function normalizeNode(n) {
  return {
    ...n,
    x: n.position_x ?? n.x ?? 0,
    y: n.position_y ?? n.y ?? 0,
  };
}

/**
 * Convert backend edge shape → frontend shape.
 * Backend uses from_node_id/to_node_id; frontend uses from/to.
 */
export function normalizeEdge(e) {
  return {
    ...e,
    from:         e.from_node_id  ?? e.from,
    to:           e.to_node_id    ?? e.to,
  };
}

/**
 * Convert frontend node shape → backend shape for saving.
 */
export function denormalizeNode(n) {
  return {
    id:         n.id,
    type:       n.type,
    title:      n.title,
    position_x: n.x ?? n.position_x ?? 0,
    position_y: n.y ?? n.position_y ?? 0,
    config:     n.config || {},
  };
}

/**
 * Convert frontend edge shape → backend shape for saving.
 */
export function denormalizeEdge(e) {
  return {
    id:            e.id,
    from_node_id:  e.from ?? e.from_node_id,
    to_node_id:    e.to   ?? e.to_node_id,
  };
}
