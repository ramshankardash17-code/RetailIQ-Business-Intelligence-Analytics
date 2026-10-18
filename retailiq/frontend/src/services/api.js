import axios from 'axios';

// Support VITE_API_BASE_URL (standard) or VITE_API_URL (legacy), fallback to localhost:8000
const RAW_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Normalize URL: strip trailing slash and optional /api suffix
const SERVER_ROOT = RAW_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '');
const API_BASE_URL = `${SERVER_ROOT}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
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
};

export default api;
