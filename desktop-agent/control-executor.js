/**
 * Control Executor
 * Executes mouse and keyboard events using PowerShell/.NET on Windows
 * No native dependencies required - pure Electron solution
 */

const { spawn } = require('child_process');

// PowerShell script for mouse/keyboard control using .NET
const PS_SCRIPT = `
Add-Type @"
using System;
using System.Runtime.InteropServices;

public class InputSimulator {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetCursorPos(int X, int Y);
    
    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, int dx, int dy, int dwData, int dwExtraInfo);
    
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, int dwExtraInfo);
    
    [DllImport("user32.dll")]
    public static extern short VkKeyScan(char ch);
    
    [DllImport("user32.dll")]
    public static extern int GetSystemMetrics(int nIndex);
    
    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const uint MOUSEEVENTF_RIGHTDOWN = 0x0008;
    public const uint MOUSEEVENTF_RIGHTUP = 0x0010;
    public const uint MOUSEEVENTF_MIDDLEDOWN = 0x0020;
    public const uint MOUSEEVENTF_MIDDLEUP = 0x0040;
    public const uint MOUSEEVENTF_WHEEL = 0x0800;
    public const uint MOUSEEVENTF_HWHEEL = 0x01000;
    
    public const uint KEYEVENTF_KEYDOWN = 0x0000;
    public const uint KEYEVENTF_KEYUP = 0x0002;
    public const uint KEYEVENTF_EXTENDEDKEY = 0x0001;
    
    public static void MoveMouse(int x, int y) {
        SetCursorPos(x, y);
    }
    
    public static void MouseClick(string button) {
        if (button == "left") {
            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        } else if (button == "right") {
            mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
            mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
        } else if (button == "middle") {
            mouse_event(MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0);
            mouse_event(MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0);
        }
    }
    
    public static void MouseDown(string button) {
        if (button == "left") mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
        else if (button == "right") mouse_event(MOUSEEVENTF_RIGHTDOWN, 0, 0, 0, 0);
        else if (button == "middle") mouse_event(MOUSEEVENTF_MIDDLEDOWN, 0, 0, 0, 0);
    }
    
    public static void MouseUp(string button) {
        if (button == "left") mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        else if (button == "right") mouse_event(MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);
        else if (button == "middle") mouse_event(MOUSEEVENTF_MIDDLEUP, 0, 0, 0, 0);
    }
    
    public static void MouseScroll(int amount) {
        mouse_event(MOUSEEVENTF_WHEEL, 0, 0, amount * 120, 0);
    }
    
    public static void MouseScrollH(int amount) {
        mouse_event(MOUSEEVENTF_HWHEEL, 0, 0, amount * 120, 0);
    }
    
    public static void KeyDown(byte vk, bool extended) {
        uint flags = KEYEVENTF_KEYDOWN;
        if (extended) flags |= KEYEVENTF_EXTENDEDKEY;
        keybd_event(vk, 0, flags, 0);
    }
    
    public static void KeyUp(byte vk, bool extended) {
        uint flags = KEYEVENTF_KEYUP;
        if (extended) flags |= KEYEVENTF_EXTENDEDKEY;
        keybd_event(vk, 0, flags, 0);
    }
    
    public static int GetScreenWidth() {
        return GetSystemMetrics(0);
    }
    
    public static int GetScreenHeight() {
        return GetSystemMetrics(1);
    }
}
"@
`;

// Virtual key codes for Windows
const VK_CODES = {
  // Letters
  'KeyA': 0x41, 'KeyB': 0x42, 'KeyC': 0x43, 'KeyD': 0x44, 'KeyE': 0x45,
  'KeyF': 0x46, 'KeyG': 0x47, 'KeyH': 0x48, 'KeyI': 0x49, 'KeyJ': 0x4A,
  'KeyK': 0x4B, 'KeyL': 0x4C, 'KeyM': 0x4D, 'KeyN': 0x4E, 'KeyO': 0x4F,
  'KeyP': 0x50, 'KeyQ': 0x51, 'KeyR': 0x52, 'KeyS': 0x53, 'KeyT': 0x54,
  'KeyU': 0x55, 'KeyV': 0x56, 'KeyW': 0x57, 'KeyX': 0x58, 'KeyY': 0x59,
  'KeyZ': 0x5A,
  
  // Numbers
  'Digit0': 0x30, 'Digit1': 0x31, 'Digit2': 0x32, 'Digit3': 0x33,
  'Digit4': 0x34, 'Digit5': 0x35, 'Digit6': 0x36, 'Digit7': 0x37,
  'Digit8': 0x38, 'Digit9': 0x39,
  
  // Function keys
  'F1': 0x70, 'F2': 0x71, 'F3': 0x72, 'F4': 0x73, 'F5': 0x74,
  'F6': 0x75, 'F7': 0x76, 'F8': 0x77, 'F9': 0x78, 'F10': 0x79,
  'F11': 0x7A, 'F12': 0x7B,
  
  // Special keys
  'Space': 0x20, 'Enter': 0x0D, 'Tab': 0x09, 'Escape': 0x1B,
  'Backspace': 0x08, 'Delete': 0x2E, 'Insert': 0x2D,
  'Home': 0x24, 'End': 0x23, 'PageUp': 0x21, 'PageDown': 0x22,
  
  // Arrow keys (extended)
  'ArrowUp': 0x26, 'ArrowDown': 0x28, 'ArrowLeft': 0x25, 'ArrowRight': 0x27,
  
  // Modifier keys
  'ShiftLeft': 0x10, 'ShiftRight': 0x10,
  'ControlLeft': 0x11, 'ControlRight': 0x11,
  'AltLeft': 0x12, 'AltRight': 0x12,
  'MetaLeft': 0x5B, 'MetaRight': 0x5C,
  'Shift': 0x10, 'Control': 0x11, 'Alt': 0x12, 'Meta': 0x5B,
  
  // Symbols
  'Minus': 0xBD, 'Equal': 0xBB,
  'BracketLeft': 0xDB, 'BracketRight': 0xDD,
  'Backslash': 0xDC, 'Semicolon': 0xBA, 'Quote': 0xDE,
  'Comma': 0xBC, 'Period': 0xBE, 'Slash': 0xBF, 'Backquote': 0xC0,
  
  // Numpad
  'Numpad0': 0x60, 'Numpad1': 0x61, 'Numpad2': 0x62, 'Numpad3': 0x63,
  'Numpad4': 0x64, 'Numpad5': 0x65, 'Numpad6': 0x66, 'Numpad7': 0x67,
  'Numpad8': 0x68, 'Numpad9': 0x69,
  'NumpadMultiply': 0x6A, 'NumpadAdd': 0x6B, 'NumpadSubtract': 0x6D,
  'NumpadDecimal': 0x6E, 'NumpadDivide': 0x6F, 'NumpadEnter': 0x0D,
  
  // Lock keys
  'CapsLock': 0x14, 'NumLock': 0x90, 'ScrollLock': 0x91,
  
  // Other
  'PrintScreen': 0x2C, 'Pause': 0x13,
};

// Extended keys that need the extended flag
const EXTENDED_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown', 'Insert', 'Delete',
  'NumpadDivide', 'NumpadEnter',
  'ControlRight', 'AltRight', 'MetaLeft', 'MetaRight'
];

// Mouse button mapping
const BUTTON_MAP = {
  0: 'left',
  1: 'middle',
  2: 'right'
};

class ControlExecutor {
  constructor() {
    this.screenWidth = 1920;
    this.screenHeight = 1080;
    this.enabled = true;
    this.psProcess = null;
    this.initialized = false;
    this.commandQueue = [];
    this.processing = false;
    this.workerReady = false;
    this.startingWorker = false;
    this.maxQueueSize = 250;
  }

  /**
   * Initialize the control executor
   */
  async initialize() {
    if (process.platform !== 'win32') {
      console.log('Warning: Control executor currently only supports Windows');
      return;
    }

    try {
      // Get screen size
      const result = await this.runPowerShell(`
        ${PS_SCRIPT}
        Write-Output "[InputSimulator]::GetScreenWidth(),[InputSimulator]::GetScreenHeight()"
        $w = [InputSimulator]::GetScreenWidth()
        $h = [InputSimulator]::GetScreenHeight()
        Write-Output "$w,$h"
      `);
      
      const lines = result.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      const [width, height] = lastLine.split(',').map(n => parseInt(n.trim()));
      
      if (width && height) {
        this.screenWidth = width;
        this.screenHeight = height;
      }

      this.startPowerShellWorker();
      
      this.initialized = true;
      console.log(`ControlExecutor initialized. Screen: ${this.screenWidth}x${this.screenHeight}`);
    } catch (error) {
      console.error('Failed to initialize:', error);
    }
  }

  /**
   * Run PowerShell command
   */
  runPowerShell(script) {
    return new Promise((resolve, reject) => {
      const ps = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy', 'Bypass',
        '-Command', script
      ]);

      let stdout = '';
      let stderr = '';

      ps.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      ps.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ps.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `PowerShell exited with code ${code}`));
        }
      });

      ps.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Execute input command (fire and forget for speed)
   */
  executeCommand(command) {
    this.enqueueCommand(command);
  }

  /**
   * Start a persistent PowerShell process so we avoid process spawn cost per event.
   */
  startPowerShellWorker() {
    if (process.platform !== 'win32') return;
    if (this.workerReady || this.startingWorker) return;

    this.startingWorker = true;

    this.psProcess = spawn('powershell.exe', [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-Command', '-'
    ]);

    this.psProcess.stdout.on('data', () => {
      // Intentionally ignored; input simulation commands are fire-and-forget.
    });

    this.psProcess.stderr.on('data', (data) => {
      const err = data.toString().trim();
      if (err) {
        console.error('PowerShell worker stderr:', err);
      }
    });

    this.psProcess.on('error', (err) => {
      console.error('PowerShell worker error:', err);
      this.workerReady = false;
      this.startingWorker = false;
    });

    this.psProcess.on('close', (code) => {
      this.workerReady = false;
      this.startingWorker = false;
      this.psProcess = null;

      if (code !== 0) {
        console.error('PowerShell worker exited with code:', code);
      }

      if (this.enabled) {
        setTimeout(() => this.startPowerShellWorker(), 250);
      }
    });

    this.psProcess.stdin.write(`${PS_SCRIPT}\n`);
    this.workerReady = true;
    this.startingWorker = false;
    this.processQueue();
  }

  enqueueCommand(command) {
    if (!command) return;

    if (!this.workerReady) {
      this.startPowerShellWorker();
    }

    if (this.commandQueue.length >= this.maxQueueSize) {
      // Keep queue bounded under bursts by dropping the oldest command.
      this.commandQueue.shift();
    }

    const isMoveCmd = command.includes('[InputSimulator]::MoveMouse(') &&
      !command.includes('MouseDown') &&
      !command.includes('MouseUp') &&
      !command.includes('MouseClick') &&
      !command.includes('MouseScroll');

    if (isMoveCmd && this.commandQueue.length > 0) {
      const lastIndex = this.commandQueue.length - 1;
      const last = this.commandQueue[lastIndex];
      const lastIsMove = last.includes('[InputSimulator]::MoveMouse(') &&
        !last.includes('MouseDown') &&
        !last.includes('MouseUp') &&
        !last.includes('MouseClick') &&
        !last.includes('MouseScroll');

      // Coalesce move storms to latest point to reduce lag.
      if (lastIsMove) {
        this.commandQueue[lastIndex] = command;
        return;
      }
    }

    this.commandQueue.push(command);
    this.processQueue();
  }

  processQueue() {
    if (this.processing) return;
    if (!this.workerReady || !this.psProcess || !this.psProcess.stdin.writable) return;
    if (this.commandQueue.length === 0) return;

    this.processing = true;

    const flush = () => {
      if (!this.psProcess || !this.psProcess.stdin.writable) {
        this.processing = false;
        return;
      }

      const next = this.commandQueue.shift();
      if (!next) {
        this.processing = false;
        return;
      }

      const canContinue = this.psProcess.stdin.write(`${next}\n`);
      if (!canContinue) {
        this.psProcess.stdin.once('drain', flush);
        return;
      }

      if (this.commandQueue.length > 0) {
        setImmediate(flush);
      } else {
        this.processing = false;
      }
    };

    flush();
  }

  /**
   * Set screen size for coordinate mapping
   */
  setScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Enable/disable control execution
   */
  setEnabled(enabled) {
    this.enabled = enabled;

    if (enabled && !this.workerReady) {
      this.startPowerShellWorker();
    }

    if (!enabled) {
      this.commandQueue.length = 0;
    }
  }

  /**
   * Execute a control event
   */
  async execute(event) {
    console.log('ControlExecutor.execute called with:', event);
    
    if (!this.enabled) {
      console.log('Control executor is disabled');
      return;
    }
    
    if (process.platform !== 'win32') {
      console.log('Not Windows, skipping');
      return;
    }

    try {
      const eventType = event.type;
      console.log('Event type:', eventType);
      
      if (['mousemove', 'mousedown', 'mouseup', 'click', 'dblclick', 'scroll', 'contextmenu'].includes(eventType)) {
        console.log('Executing mouse event');
        await this.executeMouseEvent(event);
      } else if (['keydown', 'keyup'].includes(eventType)) {
        console.log('Executing keyboard event');
        await this.executeKeyboardEvent(event);
      } else {
        console.log('Unknown event type:', eventType);
      }
    } catch (error) {
      console.error('Error executing control event:', error);
    }
  }

  /**
   * Execute mouse events
   */
  async executeMouseEvent(event) {
    const { type, x, y, relX, relY, button, deltaX, deltaY, videoWidth, videoHeight } = event;
    
    console.log('executeMouseEvent:', { type, x, y, relX, relY, videoWidth, videoHeight });
    
    // Calculate screen coordinates
    let screenX, screenY;
    
    if (typeof x === 'number' && typeof y === 'number') {
      if (videoWidth && videoHeight) {
        screenX = Math.round((x / videoWidth) * this.screenWidth);
        screenY = Math.round((y / videoHeight) * this.screenHeight);
      } else {
        screenX = Math.round(x);
        screenY = Math.round(y);
      }
    } else if (typeof relX === 'number' && typeof relY === 'number') {
      screenX = Math.round(relX * this.screenWidth);
      screenY = Math.round(relY * this.screenHeight);
    } else {
      return;
    }

    // Clamp to screen bounds
    screenX = Math.max(0, Math.min(screenX, this.screenWidth - 1));
    screenY = Math.max(0, Math.min(screenY, this.screenHeight - 1));

    const btn = BUTTON_MAP[button] || 'left';
    let command = '';

    switch (type) {
      case 'mousemove':
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY})`;
        break;

      case 'mousedown':
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY}); [InputSimulator]::MouseDown("${btn}")`;
        break;

      case 'mouseup':
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY}); [InputSimulator]::MouseUp("${btn}")`;
        break;

      case 'click':
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY}); [InputSimulator]::MouseClick("${btn}")`;
        break;

      case 'dblclick':
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY}); [InputSimulator]::MouseClick("left"); Start-Sleep -Milliseconds 50; [InputSimulator]::MouseClick("left")`;
        break;

      case 'contextmenu':
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY}); [InputSimulator]::MouseClick("right")`;
        break;

      case 'scroll': {
        const scrollY = deltaY ? -Math.sign(deltaY) : 0;
        const scrollX = deltaX ? Math.sign(deltaX) : 0;
        command = `[InputSimulator]::MoveMouse(${screenX}, ${screenY})`;
        if (scrollY !== 0) {
          command += `; [InputSimulator]::MouseScroll(${scrollY})`;
        }
        if (scrollX !== 0) {
          command += `; [InputSimulator]::MouseScrollH(${scrollX})`;
        }
        break;
      }
    }

    if (command) {
      console.log('>>> EXECUTING MOUSE:', type, 'at', screenX, screenY);
      this.executeCommand(command);
    } else {
      console.log('No command generated for:', type);
    }
  }

  /**
   * Execute keyboard events
   */
  async executeKeyboardEvent(event) {
    const { type, code, key } = event;
    
    console.log('executeKeyboardEvent:', { type, code, key });
    
    let vk = VK_CODES[code];
    
    // For single characters not in map, try getting VK from character
    if (!vk && key && key.length === 1) {
      vk = key.toUpperCase().charCodeAt(0);
    }
    
    if (!vk) {
      console.log(`Unmapped key: ${code}, key: ${key}`);
      return;
    }

    const isExtended = EXTENDED_KEYS.includes(code);
    const extendedStr = isExtended ? '$true' : '$false';

    let command = '';
    
    if (type === 'keydown') {
      command = `[InputSimulator]::KeyDown(${vk}, ${extendedStr})`;
      console.log('>>> EXECUTING KEYDOWN:', key, 'vk:', vk);
    } else if (type === 'keyup') {
      command = `[InputSimulator]::KeyUp(${vk}, ${extendedStr})`;
      console.log('>>> EXECUTING KEYUP:', key, 'vk:', vk);
    }

    if (command) {
      this.executeCommand(command);
    }
  }

  /**
   * Test mouse movement
   */
  async testMove() {
    const centerX = Math.round(this.screenWidth / 2);
    const centerY = Math.round(this.screenHeight / 2);
    
    this.executeCommand(`[InputSimulator]::MoveMouse(${centerX}, ${centerY})`);
    console.log(`Test: Moving mouse to center (${centerX}, ${centerY})`);
  }

  shutdown() {
    this.enabled = false;
    this.commandQueue.length = 0;

    if (this.psProcess) {
      try {
        this.psProcess.stdin.end();
      } catch (error) {
        // Ignore errors while app is shutting down.
      }

      try {
        this.psProcess.kill();
      } catch (error) {
        // Ignore kill errors during teardown.
      }
    }

    this.psProcess = null;
    this.workerReady = false;
    this.startingWorker = false;
  }
}

module.exports = { ControlExecutor };
