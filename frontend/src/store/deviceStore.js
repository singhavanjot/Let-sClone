/**
 * Device Store
 * Zustand store for managing devices
 */

import { create } from 'zustand';
import api from '../services/api';

const useDeviceStore = create((set, get) => ({
  // State
  devices: [],
  currentDevice: null,
  isLoading: false,
  error: null,

  // Actions
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch all devices
  fetchDevices: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/devices');
      set({
        devices: response.data.devices,
        isLoading: false
      });
      return response.data.devices;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to fetch devices';
      set({ isLoading: false, error: message });
      return [];
    }
  },

  // Register new device
  registerDevice: async (deviceData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/devices', deviceData);
      const newDevice = response.data.device;
      
      set((state) => ({
        devices: [...state.devices, newDevice],
        currentDevice: newDevice,
        isLoading: false
      }));

      return { success: true, device: newDevice };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to register device';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Update device
  updateDevice: async (deviceId, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/devices/${deviceId}`, data);
      const updatedDevice = response.data.device;

      set((state) => ({
        devices: state.devices.map((d) =>
          d.deviceId === deviceId ? updatedDevice : d
        ),
        isLoading: false
      }));

      return { success: true, device: updatedDevice };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update device';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Delete device
  deleteDevice: async (deviceId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/devices/${deviceId}`);

      set((state) => ({
        devices: state.devices.filter((d) => d.deviceId !== deviceId),
        currentDevice:
          state.currentDevice?.deviceId === deviceId
            ? null
            : state.currentDevice,
        isLoading: false
      }));

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete device';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  // Set current device
  setCurrentDevice: (device) => set({ currentDevice: device }),

  // Get or create device for this browser
  getOrCreateDevice: async () => {
    const { devices, currentDevice, registerDevice } = get();

    // If we already have a current device, return it
    if (currentDevice) {
      return currentDevice;
    }

    // Get device info
    const deviceInfo = {
      name: getDeviceName(),
      type: getDeviceType(),
      os: getOS(),
      browser: getBrowser()
    };

    // Check if device already exists (by name)
    const existingDevice = devices.find(
      (d) => d.name === deviceInfo.name && d.os === deviceInfo.os
    );

    if (existingDevice) {
      set({ currentDevice: existingDevice });
      return existingDevice;
    }

    // Register new device
    const result = await registerDevice(deviceInfo);
    return result.success ? result.device : null;
  }
}));

// Helper functions to get device information
function getDeviceName() {
  const hostname = window.location.hostname;
  const userAgent = navigator.userAgent;
  
  // Try to create a meaningful name
  const os = getOS();
  const browser = getBrowser();
  
  return `${os} - ${browser}`;
}

function getDeviceType() {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'mobile';
  }
  
  if (/laptop/i.test(ua)) {
    return 'laptop';
  }
  
  return 'desktop';
}

function getOS() {
  const ua = navigator.userAgent;
  
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  
  return 'Unknown OS';
}

function getBrowser() {
  const ua = navigator.userAgent;
  
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Opera')) return 'Opera';
  
  return 'Unknown Browser';
}

export default useDeviceStore;
