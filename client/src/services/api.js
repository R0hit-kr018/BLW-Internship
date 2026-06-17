import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

// Request interceptor - add token
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('railguard_user') || 'null');
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Response interceptor - handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('railguard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getProfile = () => API.get('/auth/me');

// Users
export const getUsers = (params) => API.get('/users', { params });
export const updateUser = (id, data) => API.put(`/users/${id}`, data);
export const deleteUser = (id) => API.delete(`/users/${id}`);

// Equipment
export const getEquipment = (params) => API.get('/equipment', { params });
export const getEquipmentById = (id) => API.get(`/equipment/${id}`);
export const createEquipment = (data) => API.post('/equipment', data);
export const updateEquipment = (id, data) => API.put(`/equipment/${id}`, data);
export const deleteEquipment = (id) => API.delete(`/equipment/${id}`);
export const predictMaintenance = (id) => API.post(`/equipment/${id}/predict`);
export const getAIAnalysis = (id) => API.post(`/equipment/${id}/ai-analysis`);

// Maintenance
export const getMaintenanceRecords = (params) => API.get('/maintenance', { params });
export const getMaintenanceById = (id) => API.get(`/maintenance/${id}`);
export const createMaintenance = (data) => API.post('/maintenance', data);
export const updateMaintenance = (id, data) => API.put(`/maintenance/${id}`, data);
export const deleteMaintenance = (id) => API.delete(`/maintenance/${id}`);

// Dashboard
export const getDashboardStats = () => API.get('/dashboard/stats');

// Alerts
export const getAlerts = (params) => API.get('/alerts', { params });
export const resolveAlert = (id) => API.put(`/alerts/${id}/resolve`);
export const markAlertRead = (id) => API.put(`/alerts/${id}/read`);

// Reports
export const getEquipmentReport = () => API.get('/reports/equipment-summary');
export const getMaintenanceReport = (params) => API.get('/reports/maintenance-history', { params });
export const getCostReport = () => API.get('/reports/cost-analysis');

export default API;
