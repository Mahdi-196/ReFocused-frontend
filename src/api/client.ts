import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with proper TypeScript typing
const client: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased to 30 seconds for better reliability
});

// Request interceptor for auth tokens
client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('REF_TOKEN');
      if (token && token !== 'dummy-auth-token') {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      console.warn('⏰ API request timed out after 30 seconds:', error.config?.url);
      error.isTimeout = true;
    }
    
    // Handle CORS errors
    if (error.code === 'ERR_NETWORK' && error.message === 'Network Error') {
      console.warn('🌐 Network/CORS error - backend may be unavailable:', error.config?.url);
      error.isNetworkError = true;
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== 'undefined') {
        localStorage.removeItem('REF_TOKEN');
        localStorage.removeItem('REF_USER');
        delete client.defaults.headers.common['Authorization'];
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Initialize auth - will be called from client components only
export const initializeAuth = () => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("REF_TOKEN");
    if (token && token !== 'dummy-auth-token') {
      client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log('Auth initialized with token');
    } else {
      console.log('No valid token found for auth initialization');
    }
  }
};

// ✅ Real backend API integration
// Backend running on http://localhost:8000 via Next.js rewrites
// Documentation: http://localhost:8000/docs

export default client;  