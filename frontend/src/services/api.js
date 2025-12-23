/**
 * API Service
 * Axios instance configured for API calls
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage (managed by zustand persist)
    const authStorage = localStorage.getItem('auth-storage');
    
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      const authStorage = localStorage.getItem('auth-storage');
      
      if (authStorage) {
        try {
          const { state } = JSON.parse(authStorage);
          
          if (state?.refreshToken) {
            const response = await axios.post(`${API_URL}/auth/refresh`, {
              refreshToken: state.refreshToken
            });

            const { token, refreshToken } = response.data;

            // Update stored tokens
            const newState = {
              ...state,
              token,
              refreshToken
            };

            localStorage.setItem(
              'auth-storage',
              JSON.stringify({ state: newState })
            );

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear auth and redirect to login
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
