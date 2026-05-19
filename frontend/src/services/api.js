import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 90000, // 90s — AI calls can be slow
  headers: { 'Content-Type': 'application/json' },
});

// Attach session ID to every request
api.interceptors.request.use((config) => {
  const sessionId = getOrCreateSessionId();
  config.headers['X-Session-ID'] = sessionId;
  return config;
});

// Central error logging
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[API Error]', err.response?.data || err.message);
    return Promise.reject(err);
  }
);

function getOrCreateSessionId() {
  let id = sessionStorage.getItem('cc_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2, 11) + Date.now();
    sessionStorage.setItem('cc_session_id', id);
  }
  return id;
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export const conceptApi = {
  /**
   * POST /explain — main explain endpoint
   */
  explain: (topic, level, type) =>
    api.post('/explain', {
      topic,
      level,
      type,
      sessionId: getOrCreateSessionId(),
    }),

  /**
   * GET /history — paginated history
   */
  getHistory: (page = 0, size = 20) =>
    api.get('/history', { params: { page, size } }),

  /**
   * GET /history/:id — single explanation by ID
   */
  getHistoryById: (id) =>
    api.get(`/history/${id}`),

  /**
   * GET /history/session/:sessionId — this session's history
   */
  getSessionHistory: () =>
    api.get(`/history/session/${getOrCreateSessionId()}`),

  /**
   * GET /history/search?q= — search history
   */
  searchHistory: (keyword) =>
    api.get('/history/search', { params: { q: keyword } }),

  /**
   * GET /health — backend health check
   */
  health: () =>
    api.get('/health'),
};

export default api;
