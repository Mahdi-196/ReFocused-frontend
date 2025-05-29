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
    // Don't log mock errors as real errors
    if (!error.isAxiosMockError) {
      console.error('Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
client.interceptors.response.use(
  response => response,
  error => {
    // Don't log mock errors as real errors
    if (!error.isAxiosMockError) {
      // Handle network errors
      if (error.message === 'Network Error') {
        console.error('Network error - server may be unavailable');
      }
      
      // Log all API errors (except mock ones)
      console.error('API Error:', error.config?.url, error.message);
    }
    
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
  { 
    id: 201, 
    user_id: 1,
    goal_text: 'Implement new features', 
    progress: 45, 
    category: 'sprint' as const,
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 202, 
    user_id: 1,
    goal_text: 'Code refactoring', 
    progress: 80, 
    category: 'sprint' as const,
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 301, 
    user_id: 1,
    goal_text: 'Launch MVP', 
    progress: 25, 
    category: 'long_term' as const,
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  { 
    id: 302, 
    user_id: 1,
    goal_text: 'Grow user base', 
    progress: 15, 
    category: 'long_term' as const,
    completed: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
];

// ALWAYS use mock API regardless of environment variable
// Mock API interceptor for development
client.interceptors.request.use(
  async (config) => {
    // Always use mock for development
    const mockResponse = await handleMockRequest(config);
    if (mockResponse) {
      // Return a mock response directly by throwing an axios mock error
      const mockError = new Error('Mock response') as any;
      mockError.isAxiosMockError = true;
      mockError.response = mockResponse;
      return Promise.reject(mockError);
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
  
  // Google OAuth endpoint
  if (url === '/auth/google' && method === 'post') {
    const body = typeof data === 'string' ? JSON.parse(data) : data;
    if (body.token) {
      return {
        data: {
          access_token: 'mock-google-jwt-token-for-testing',
          user: {
            id: 999,
            email: 'googleuser@example.com',
            username: 'googleuser',
            name: 'Google User',
            google_id: 'mock-google-id-123'
          }
        },
        status: 200
      };
    } else {
      return {
        data: { message: 'Invalid Google token' },
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
      user_id: 1,
      goal_text: body.goal_text,
      progress: 0,
      category: body.category,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
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
      goal_text: body.goal_text || mockGoals[goalIndex].goal_text,
      progress: typeof body.progress === 'number' ? body.progress : mockGoals[goalIndex].progress,
      completed: typeof body.completed === 'boolean' ? body.completed : mockGoals[goalIndex].completed,
      category: body.category || mockGoals[goalIndex].category,
      updated_at: new Date().toISOString()
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