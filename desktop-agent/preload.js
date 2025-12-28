/**
 * Preload script for secure IPC between renderer and main process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Connect to server
  connect: (options) => ipcRenderer.invoke('connect', options),
  
  // Disconnect from server
  disconnect: () => ipcRenderer.invoke('disconnect'),
  
  // Get screen info
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  
  // Test control
  testControl: () => ipcRenderer.invoke('test-control'),
  
  // Listen for events from main process
  onConnectionStatus: (callback) => {
    ipcRenderer.on('connection-status', (event, data) => callback(data));
  },
  
  onError: (callback) => {
    ipcRenderer.on('error', (event, data) => callback(data));
  },
  
  onInitSettings: (callback) => {
    ipcRenderer.on('init-settings', (event, data) => callback(data));
  },
  
  // Listen for auto-connect from deep link
  onAutoConnect: (callback) => {
    ipcRenderer.on('auto-connect', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
