import axios from 'axios';

// Create a pre-configured axios instance for API requests
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1",
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
    // You could add dynamic headers here if needed
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
      console.error('Network error - server may be unavailable');
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

// Mock data for development
let mockGoals = [
  { id: 201, name: 'Implement new features', progress: 45, type: 'sprint', category: 'sprint' },
  { id: 202, name: 'Code refactoring', progress: 80, type: 'sprint', category: 'sprint' },
  { id: 301, name: 'Launch MVP', progress: 25, type: 'vision', category: 'long_term' },
  { id: 302, name: 'Grow user base', progress: 15, type: 'vision', category: 'long_term' },
];

// ALWAYS use mock API regardless of environment variable
// Mock API interceptor for development
client.interceptors.request.use(
  async (config) => {
    const mockResponse = await handleMockRequest(config);
    if (mockResponse) {
      // Return a mock response directly
      return Promise.reject({
        isAxiosMockError: true,
        response: mockResponse
      });
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle mock responses
client.interceptors.response.use(
  response => response,
  error => {
    if (error.isAxiosMockError && error.response) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

// Handle mock API requests
async function handleMockRequest(config: { 
  url?: string; 
  method?: string; 
  data?: any;
  [key: string]: any;
}) {
  // Sleep to simulate network delay
  await new Promise(resolve => setTimeout(resolve, parseInt(process.env.NEXT_PUBLIC_MOCK_API_DELAY || '300')));
  
  const { url = '', method = '', data } = config;
  
  // Mock auth endpoints
  if (url === '/auth/login' && method === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data;
    // Simple mock validation
    if (body.email && body.password) {
      return {
        data: {
          access_token: 'mock-jwt-token-for-testing',
          user: {
            id: 1,
            email: body.email,
            username: 'testuser',
            name: 'Test User'
          }
        },
        status: 200
      };
    } else {
      return {
        data: { message: 'Invalid credentials' },
        status: 401
      };
    }
  }
  
  if (url === '/auth/register' && method === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data;
    if (body.email && body.password && body.username) {
      return {
        data: { 
          message: 'Registration successful',
          user: {
            id: Date.now(),
            email: body.email,
            username: body.username,
            name: body.name || body.username
          }
        },
        status: 201
      };
    } else {
      return {
        data: { message: 'Invalid registration data' },
        status: 400
      };
    }
  }
  
  // GET /goals - List all goals
  if (url === '/goals' && method === 'get') {
    return {
      data: mockGoals,
      status: 200,
    };
  }
  
  // POST /goals - Create a new goal
  if (url === '/goals' && method === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data;
    const newGoal = {
      id: Date.now(),
      name: body.goal_text,
      progress: 0,
      type: body.category,
      category: body.category
    };
    mockGoals.push(newGoal);
    return {
      data: newGoal,
      status: 201,
    };
  }
  
  // PATCH /goals/:id - Update a goal
  if (url.match(/\/goals\/\d+/) && method === 'patch') {
    const id = parseInt(url.split('/').pop() || '0');
    const body = typeof data === 'string' ? JSON.parse(data) : data;
    
    const goalIndex = mockGoals.findIndex(g => g.id === id);
    if (goalIndex === -1) {
      return {
        data: { message: 'Goal not found' },
        status: 404,
      };
    }
    
    mockGoals[goalIndex] = {
      ...mockGoals[goalIndex],
      name: body.goal_text || mockGoals[goalIndex].name,
      progress: typeof body.progress === 'number' ? body.progress : mockGoals[goalIndex].progress,
    };
    
    return {
      data: mockGoals[goalIndex],
      status: 200,
    };
  }
  
  // DELETE /goals/:id - Delete a goal
  if (url.match(/\/goals\/\d+/) && method === 'delete') {
    const id = parseInt(url.split('/').pop() || '0');
    const initialLength = mockGoals.length;
    mockGoals = mockGoals.filter(g => g.id !== id);
    
    if (mockGoals.length === initialLength) {
      return {
        data: { message: 'Goal not found' },
        status: 404,
      };
    }
    
    return {
      data: { message: 'Goal deleted successfully' },
      status: 200,
    };
  }
  
  // No mock implementation found, let the request go through
  return null;
}

export default client; 