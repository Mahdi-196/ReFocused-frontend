import axios from 'axios';

// Create a pre-configured axios instance for API requests
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
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
    // Add dynamic headers here if needed
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
    
    // Handle 401 unauthorized errors
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('REF_TOKEN');
      localStorage.removeItem('REF_USER');
      // Redirect to login
      window.location.href = '/';
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
    if (token) {
      client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }
};

// ✅ Real backend API integration
// Backend running on http://localhost:8000
// Documentation: http://localhost:8000/docs

export default client;  