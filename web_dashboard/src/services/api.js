import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Dashboard endpoints
  getDashboardStats: () => axiosInstance.get('/api/dashboard/stats'),
  getRecentCases: () => axiosInstance.get('/api/dashboard/recent'),
  getAnalyticsData: () => axiosInstance.get('/api/dashboard/analytics'),

  // Cases endpoints
  getAllCases: (params) => axiosInstance.get('/api/cases', { params }),
  getCaseDetails: (id) => axiosInstance.get(`/api/cases/${id}`),
  verifyCases: (caseId, data) => axiosInstance.put(`/api/cases/${caseId}/verify`, data),
  addFeedback: (caseId, feedback) =>
    axiosInstance.post(`/api/cases/${caseId}/feedback`, feedback),

  // Users endpoints
  getUsers: (params) => axiosInstance.get('/api/users', { params }),
  createUser: (data) => axiosInstance.post('/api/users', data),
  updateUser: (id, data) => axiosInstance.put(`/api/users/${id}`, data),
  deleteUser: (id) => axiosInstance.delete(`/api/users/${id}`),

  // Analytics endpoints
  getDiseaseDistribution: () => axiosInstance.get('/api/analytics/diseases'),
  getRegionalStats: () => axiosInstance.get('/api/analytics/regions'),
  getTrends: (period) => axiosInstance.get(`/api/analytics/trends?period=${period}`),

  // Auth endpoints
  login: (credentials) => axiosInstance.post('/api/auth/login', credentials),
  logout: () => axiosInstance.post('/api/auth/logout'),
  refreshToken: () => axiosInstance.post('/api/auth/refresh'),

  // Health check
  healthCheck: () => axiosInstance.get('/health'),
};

export default axiosInstance;
