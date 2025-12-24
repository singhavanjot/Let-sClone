/**
 * Session Store
 * Zustand store for managing Let'sClone sessions
 */

import { create } from 'zustand';
import api from '../services/api';

const useSessionStore = create((set, get) => ({
  // State
  currentSession: null,
  activeSessions: [],
  sessionHistory: [],
  isLoading: false,
  error: null,
  
  // Connection state
  connectionState: 'disconnected', // disconnected, connecting, connected, failed

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setConnectionState: (state) => set({ connectionState: state }),

  // Create new session
  createSession: async (deviceId, options = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/sessions', {
        deviceId,
        connectionType: options.connectionType || 'full-control',
        settings: options.settings || {}
      });

      const session = response.data.session;
      
      set({
        currentSession: session,
        isLoading: false
      });

      return { success: true, session };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create session';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Join existing session
  joinSession: async (sessionCode, deviceId) => {
    set({ isLoading: true, error: null, connectionState: 'connecting' });
    try {
      const response = await api.post('/sessions/join', {
        sessionCode: sessionCode.toUpperCase(),
        deviceId
      });

      const session = response.data.session;
      
      set({
        currentSession: session,
        isLoading: false
      });

      return { success: true, session };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to join session';
      set({ isLoading: false, error: message, connectionState: 'disconnected' });
      return { success: false, error: message };
    }
  },

  // Get session details
  getSession: async (sessionId) => {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data.session;
    } catch (error) {
      return null;
    }
  },

  // End session
  endSession: async (sessionId = null) => {
    const { currentSession } = get();
    const id = sessionId || currentSession?.id;

    if (!id) return { success: false, error: 'No active session' };

    set({ isLoading: true, error: null });
    try {
      await api.post(`/sessions/${id}/end`);

      set({
        currentSession: null,
        isLoading: false,
        connectionState: 'disconnected'
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to end session';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Get active sessions
  fetchActiveSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sessions/active');
      set({
        activeSessions: response.data.sessions,
        isLoading: false
      });
      return response.data.sessions;
    } catch (error) {
      set({ isLoading: false });
      return [];
    }
  },

  // Get session history
  fetchSessionHistory: async (page = 1, limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/sessions/history', {
        params: { page, limit }
      });
      set({
        sessionHistory: response.data.sessions,
        isLoading: false
      });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      return { sessions: [], pagination: {} };
    }
  },

  // Update session settings
  updateSettings: async (sessionId, settings) => {
    try {
      const response = await api.patch(`/sessions/${sessionId}/settings`, settings);
      
      set((state) => ({
        currentSession: state.currentSession
          ? { ...state.currentSession, settings: response.data.settings }
          : null
      }));

      return { success: true, settings: response.data.settings };
    } catch (error) {
      return { success: false, error: error.response?.data?.error };
    }
  },

  // Clear current session
  clearSession: () => {
    set({
      currentSession: null,
      connectionState: 'disconnected',
      error: null
    });
  }
}));

export default useSessionStore;
