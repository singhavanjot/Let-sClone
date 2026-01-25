/**
 * Let's Clone Desktop Agent
 * Electron app that handles actual mouse/keyboard control on host machine
 */

const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { ControlExecutor } = require('./control-executor');
const { SocketClient } = require('./socket-client');

// Initialize store for settings
const store = new Store();

let mainWindow = null;
let tray = null;
let controlExecutor = null;
let socketClient = null;
let pendingDeepLink = null; // Store deep link data before window is ready

// Custom protocol name
const PROTOCOL_NAME = 'letsclone';

// Register as default handler for letsclone:// protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(PROTOCOL_NAME, process.execPath, [path.resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient(PROTOCOL_NAME);
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  // Handle second instance (when app is already running and protocol link is clicked)
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
    
    // Parse the deep link from command line
    const url = commandLine.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
    if (url) {
      handleDeepLink(url);
    }
  });
}

/**
 * Parse deep link URL and extract connection params
 * Format: letsclone://connect?code=123456&token=xxx
 */
function parseDeepLink(url) {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    return {
      code: params.get('code'),
      token: params.get('token')
    };
  } catch (e) {
    console.error('Failed to parse deep link:', e);
    return null;
  }
}

/**
 * Handle deep link - auto-connect with provided params
 */
function handleDeepLink(url) {
  const params = parseDeepLink(url);
  if (!params || !params.code) {
    console.log('Invalid deep link params');
    return;
  }
  
  console.log('Deep link received:', { code: params.code, hasToken: !!params.token });
  
  if (mainWindow && mainWindow.webContents) {
    // Send auto-connect data to renderer
    mainWindow.webContents.send('auto-connect', {
      sessionCode: params.code,
      token: params.token
    });
  } else {
    // Window not ready yet, store for later
    pendingDeepLink = params;
  }
}

/**
 * Create the main window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 500,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false
  });

  mainWindow.loadFile('index.html');

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Hide to tray on close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

/**
 * Create system tray
 */
function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  
  try {
    const icon = nativeImage.createFromPath(iconPath);
    tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  } catch (e) {
    tray = new Tray(nativeImage.createEmpty());
  }

  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show Agent', 
      click: () => mainWindow?.show() 
    },
    { 
      label: 'Status', 
      enabled: false,
      id: 'status'
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Let's Clone Agent");
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    mainWindow?.show();
  });
}

/**
 * Initialize the control executor
 */
async function initControlExecutor() {
  controlExecutor = new ControlExecutor();
  await controlExecutor.initialize();
  
  console.log('Control executor initialized');
  
  // Get screen size for coordinate mapping
  const primaryDisplay = screen.getPrimaryDisplay();
  controlExecutor.setScreenSize(
    primaryDisplay.size.width,
    primaryDisplay.size.height
  );
}

/**
 * Handle connection to web app
 */
function handleConnect(serverUrl, token, sessionCode) {
  console.log('=== handleConnect called ===');
  console.log('Server URL:', serverUrl);
  console.log('Session Code:', sessionCode);
  console.log('Token present:', !!token);
  
  if (socketClient) {
    console.log('Disconnecting existing socket...');
    socketClient.disconnect();
  }

  socketClient = new SocketClient(serverUrl, token);

  socketClient.on('connected', () => {
    console.log('=== Socket Connected to server ===');
    mainWindow?.webContents.send('connection-status', { 
      status: 'connected', 
      sessionCode 
    });
    
    // Join the session as desktop agent
    console.log('Joining session as agent:', sessionCode);
    socketClient.joinAsAgent(sessionCode);
  });

  socketClient.on('agent-registered', (data) => {
    console.log('=== Agent Registered Successfully ===', data);
  });

  socketClient.on('disconnected', (reason) => {
    console.log('=== Socket Disconnected ===', reason);
    mainWindow?.webContents.send('connection-status', { 
      status: 'disconnected', 
      reason 
    });
  });

  socketClient.on('control-event', async (event) => {
    console.log('>>> CONTROL EVENT RECEIVED:', JSON.stringify(event));
    if (controlExecutor) {
      console.log('Executing control event...');
      await controlExecutor.execute(event);
      console.log('Control event executed');
    } else {
      console.log('No control executor!');
    }
  });

  socketClient.on('error', (error) => {
    console.error('=== Socket Error ===', error);
    mainWindow?.webContents.send('error', { message: error.message });
  });

  console.log('Calling socketClient.connect()...');
  socketClient.connect();
}

// App ready
app.whenReady().then(async () => {
  await initControlExecutor();
  createWindow();
  createTray();

  // Load saved settings
  const savedUrl = store.get('serverUrl', 'https://let-sclone.onrender.com');
  mainWindow?.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('init-settings', { serverUrl: savedUrl });
    
    // Send pending deep link if exists
    if (pendingDeepLink) {
      mainWindow?.webContents.send('auto-connect', {
        sessionCode: pendingDeepLink.code,
        token: pendingDeepLink.token
      });
      pendingDeepLink = null;
    }
  });

  // Check for deep link in command line args (Windows)
  const deepLinkArg = process.argv.find((arg) => arg.startsWith(`${PROTOCOL_NAME}://`));
  if (deepLinkArg) {
    handleDeepLink(deepLinkArg);
  }
});

// Handle open-url event (macOS)
app.on('open-url', (event, url) => {
  event.preventDefault();
  handleDeepLink(url);
});

// Handle IPC messages from renderer
ipcMain.handle('connect', async (event, { serverUrl, token, sessionCode }) => {
  console.log('[IPC] Connect called with:', { serverUrl, sessionCode, tokenLength: token?.length });
  store.set('serverUrl', serverUrl);
  handleConnect(serverUrl, token, sessionCode);
  return { success: true };
});

ipcMain.handle('disconnect', async () => {
  if (socketClient) {
    socketClient.disconnect();
    socketClient = null;
  }
  return { success: true };
});

ipcMain.handle('get-screen-info', async () => {
  const primaryDisplay = screen.getPrimaryDisplay();
  return {
    width: primaryDisplay.size.width,
    height: primaryDisplay.size.height,
    scaleFactor: primaryDisplay.scaleFactor
  };
});

ipcMain.handle('test-control', async () => {
  if (controlExecutor) {
    await controlExecutor.testMove();
    return { success: true };
  }
  return { success: false, error: 'Control executor not initialized' };
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Clean up before quit
app.on('before-quit', () => {
  app.isQuitting = true;
  if (socketClient) {
    socketClient.disconnect();
  }
});
