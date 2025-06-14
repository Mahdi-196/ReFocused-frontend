import axios from 'axios';

// Create a pre-configured axios instance for API requests
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  withCredentials: true, // Include cookies in cross-site requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000')
});

// Add request interceptor to handle common issues
client.interceptors.request.use(
  config => {
    // Dynamically add Authorization header if token exists
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('REF_TOKEN');
      if (token && token !== 'dummy-auth-token') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
client.interceptors.response.use(
  response => response,
  error => {
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - backend server may be unavailable at http://localhost:8000');
    }
    
    const errorMessage = error.response?.data?.detail?.toLowerCase() || '';

    // Handle 401 unauthorized errors more specifically
    if (error.response?.status === 401 && (errorMessage.includes('token') || errorMessage.includes('authentication'))) {
      // Clear invalid token if backend indicates an auth issue
      localStorage.removeItem('REF_TOKEN');
      localStorage.removeItem('REF_USER');
      // Redirect to login only if not already on the landing page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    
    // Log all API errors
    console.error('API Error:', error.config?.url, error.message);
    
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
// Backend running on http://localhost:8000
// Documentation: http://localhost:8000/docs

export default client;  