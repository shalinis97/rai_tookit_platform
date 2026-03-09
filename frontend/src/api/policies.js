import api from './client';

export const policiesApi = {
  list:        ()         => api.get('/policies/').then(r => r.data),
  get:         (id)       => api.get(`/policies/${id}`).then(r => r.data),
  create:      (data)     => api.post('/policies/', data).then(r => r.data),
  update:      (id, data) => api.patch(`/policies/${id}`, data).then(r => r.data),
  delete:      (id)       => api.delete(`/policies/${id}`),
  toggle:      (id)       => api.post(`/policies/${id}/toggle`).then(r => r.data),
  assign:      (id, wfId) => api.post(`/policies/${id}/assign`, { workflow_id: wfId }).then(r => r.data),
  unassign:    (id, wfId) => api.delete(`/policies/${id}/assign/${wfId}`),
  compile:     (code)     => api.post('/policies/compile', { code }).then(r => r.data),
  test:        (code, input_data) => api.post('/policies/test', { code, input_data }).then(r => r.data),
  auditLogs:   (params)   => api.get('/policies/audit/logs', { params }).then(r => r.data),
  opaHealth:   ()         => api.get('/policies/opa/health').then(r => r.data),
  quarantine:  {
    list:      ()         => api.get('/policies/quarantine/list').then(r => r.data),
    release:   (wfId)     => api.post(`/policies/quarantine/${wfId}/release`).then(r => r.data),
  },
};
