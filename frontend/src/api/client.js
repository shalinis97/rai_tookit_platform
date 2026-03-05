import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000') + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Global error interceptor — logs errors in dev
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (import.meta.env.DEV) {
      console.error('[API Error]', err.response?.status, err.response?.data || err.message);
    }
    return Promise.reject(err);
  }
);

export default api;
