import api from './client';

export const executionsApi = {
  trigger: (data)       => api.post('/executions', data).then(r => r.data),
  get:     (id)         => api.get(`/executions/${id}`).then(r => r.data),
  list:    (workflowId) => api.get(`/executions/workflow/${workflowId}`).then(r => r.data),
};
