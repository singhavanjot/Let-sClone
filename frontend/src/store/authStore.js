/**
 * Authentication Store
 * Zustand store for managing authentication state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Register user
      register: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', {
            email,
            password,
            name
          });

          const { user, token, refreshToken } = response.data;

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Login user
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', {
            email,
            password
          });

          const { user, token, refreshToken } = response.data;

          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Logout user
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null
          });
        }
      },

      // Refresh token
      refreshTokens: async () => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          return false;
        }

        try {
          const response = await api.post('/auth/refresh', {
            refreshToken
          });

          const { token, refreshToken: newRefreshToken } = response.data;

          set({
            token,
            refreshToken: newRefreshToken
          });

          return true;
        } catch (error) {
          // Token refresh failed, logout user
          get().logout();
          return false;
        }
      },

      // Get current user
      fetchUser: async () => {
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.user });
          return response.data.user;
        } catch (error) {
          // If fetch fails, might need to refresh token
          const refreshed = await get().refreshTokens();
          if (refreshed) {
            return get().fetchUser();
          }
          return null;
        }
      },

      // Update user profile
      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/me', data);
          set({
            user: response.data.user,
            isLoading: false
          });
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Update failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      },

      // Change password
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/auth/password', {
            currentPassword,
            newPassword
          });

          // Update tokens
          set({
            token: response.data.token,
            refreshToken: response.data.refreshToken,
            isLoading: false
          });

          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Password change failed';
          set({ isLoading: false, error: message });
          return { success: false, error: message };
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;
