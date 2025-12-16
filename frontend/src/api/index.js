import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  getMe: () => api.get('/api/auth/me'),
  getUsers: () => api.get('/api/auth/users'),
  createUser: (data) => api.post('/api/auth/users', data),
  updateUser: (id, data) => api.put(`/api/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/auth/users/${id}`),
};

// Teams API
export const teamsApi = {
  getAll: () => api.get('/api/teams'),
  getOne: (id) => api.get(`/api/teams/${id}`),
  getById: (id) => api.get(`/api/teams/${id}`),
  create: (data) => api.post('/api/teams', data),
  update: (id, data) => api.put(`/api/teams/${id}`, data),
  delete: (id) => api.delete(`/api/teams/${id}`),
  addPlayer: (teamId, playerId) => api.post(`/api/teams/${teamId}/players/${playerId}`),
  removePlayer: (teamId, playerId) => api.delete(`/api/teams/${teamId}/players/${playerId}`),
};

// Players API
export const playersApi = {
  getAll: () => api.get('/api/players'),
  getOne: (id) => api.get(`/api/players/${id}`),
  getById: (id) => api.get(`/api/players/${id}`),
  create: (data) => api.post('/api/players', data),
  update: (id, data) => api.put(`/api/players/${id}`, data),
  delete: (id) => api.delete(`/api/players/${id}`),
};

// Matches API
export const matchesApi = {
  getAll: (params) => api.get('/api/matches', { params }),
  getOne: (id) => api.get(`/api/matches/${id}`),
  getById: (id) => api.get(`/api/matches/${id}`),
  getUpcoming: () => api.get('/api/matches/upcoming'),
  getRecent: (limit = 10) => api.get(`/api/matches/recent?limit=${limit}`),
  create: (data) => api.post('/api/matches', data),
  load: (data) => api.post('/api/matches/load', data),
  update: (id, data) => api.put(`/api/matches/${id}`, data),
  delete: (id) => api.delete(`/api/matches/${id}`),
  addStat: (matchId, data) => api.post(`/api/matches/${matchId}/stats`, data),
};

// Stats API
export const statsApi = {
  getLeaderboard: (sortBy = 'kd', sortOrder = 'desc', limit = 50) => 
    api.get(`/api/stats/leaderboard?sort_by=${sortBy}&order=${sortOrder}&limit=${limit}`),
  getDashboard: () => api.get('/api/stats/dashboard'),
  getMapStats: () => api.get('/api/stats/maps'),
  getTeamStats: (teamId) => api.get(`/api/stats/team/${teamId}`),
};

export default api;
