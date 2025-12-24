// API Configuration for Spring Boot Backend
// Change this to your backend URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Default organization ID (you can change this or make it dynamic)
export const DEFAULT_ORG_ID = import.meta.env.VITE_ORG_ID || '';

// API request helper with error handling
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// HTTP method helpers
export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  
  post: <T>(endpoint: string, data: unknown) => 
    apiRequest<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  patch: <T>(endpoint: string, data: unknown) => 
    apiRequest<T>(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
  
  delete: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
