import axios from 'axios';

export function getResolvedBackendRoot() {
  // 1. User manual override stored in localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('RETAILIQ_BACKEND_URL');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
    }
  }

  // 2. Build-time environment variable
  const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  // 3. Dynamic inference when running on Render (*.onrender.com)
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname;
    if (hostname.endsWith('.onrender.com')) {
      let backendHost = hostname.replace('frontend', 'backend');
      if (backendHost === 'retailiq-backend.onrender.com') {
        backendHost = 'retailiq-backend-bwi5.onrender.com';
      }
      return `https://${backendHost}`;
    }
  }

  // 4. Default for local development
  return (envUrl || 'http://localhost:8000').replace(/\/api\/?$/, '').replace(/\/+$/, '');
}

export function setCustomBackendUrl(url) {
  if (typeof window !== 'undefined' && window.localStorage) {
    if (url && url.trim()) {
      localStorage.setItem('RETAILIQ_BACKEND_URL', url.trim());
    } else {
      localStorage.removeItem('RETAILIQ_BACKEND_URL');
    }
    window.location.reload();
  }
}

export const SERVER_ROOT = getResolvedBackendRoot();
export const API_BASE_URL = `${SERVER_ROOT}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const api = {
  // Dashboard
  getDashboardKPIs: (params = {}) => apiClient.get('/dashboard/kpis', { params }),

  // Sales Analytics
  getSalesAnalytics: (params = {}) => apiClient.get('/sales', { params }),

  // Products
  getProducts: (params = {}) => apiClient.get('/products', { params }),
  getProductDetail: (id) => apiClient.get(`/products/${id}`),

  // Customers
  getCustomerRFM: () => apiClient.get('/customers'),
  getCustomerProfile: (id) => apiClient.get(`/customers/${id}`),

  // Stores & Regions
  getStoreAnalytics: (params = {}) => apiClient.get('/stores', { params }),

  // Inventory
  getInventoryAnalytics: (params = {}) => apiClient.get('/inventory', { params }),

  // Prediction Center
  predictDemand: (payload) => apiClient.post('/predict/demand', payload),
  predictStockout: (payload) => apiClient.post('/predict/stockout', payload),
  predictRepeatPurchase: (payload) => apiClient.post('/predict/repeat-purchase', payload),

  // Data Management & Upload
  uploadDataset: (formData) => apiClient.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Automated Rule-Based Insights
  getRuleBasedInsights: () => apiClient.get('/insights/rule-based'),

  // Backend Health
  getSystemHealth: () => axios.get(`${SERVER_ROOT}/health`),

  // Setup & Seeding
  seedDemoData: () => axios.post(`${SERVER_ROOT}/api/setup/seed-demo`),
  initDatabase: () => axios.post(`${SERVER_ROOT}/api/setup/init-db`),
};

export default api;
