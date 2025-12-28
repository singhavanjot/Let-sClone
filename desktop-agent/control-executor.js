/**
 * Control Executor
 * Executes mouse and keyboard events using PowerShell/.NET on Windows
 * No native dependencies required - pure Electron solution
 */

const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

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
  'NumpadDecimal': 0x6E, 'NumpadDivide': 0x6F,
  
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
    const fullScript = `${PS_SCRIPT}\n${command}`;
    
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-Command', fullScript
    ], { stdio: 'ignore' });

    ps.on('error', (err) => {
      console.error('PowerShell error:', err);
    });
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
  }

  /**
   * Execute a control event
   */
  async execute(event) {
    if (!this.enabled || process.platform !== 'win32') return;

    try {
      const eventType = event.type;
      
      if (['mousemove', 'mousedown', 'mouseup', 'click', 'dblclick', 'scroll', 'contextmenu'].includes(eventType)) {
        await this.executeMouseEvent(event);
      } else if (['keydown', 'keyup'].includes(eventType)) {
        await this.executeKeyboardEvent(event);
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
      this.executeCommand(command);
    }
  }

  /**
   * Execute keyboard events
   */
  async executeKeyboardEvent(event) {
    const { type, code, key } = event;
    
    let vk = VK_CODES[code];
    
    // For single characters not in map, try getting VK from character
    if (!vk && key && key.length === 1) {
      vk = key.toUpperCase().charCodeAt(0);
    }
    
    if (!vk) {
      console.log(`Unmapped key: ${code}`);
      return;
    }

    const isExtended = EXTENDED_KEYS.includes(code);
    const extendedStr = isExtended ? '$true' : '$false';

    let command = '';
    
    if (type === 'keydown') {
      command = `[InputSimulator]::KeyDown(${vk}, ${extendedStr})`;
    } else if (type === 'keyup') {
      command = `[InputSimulator]::KeyUp(${vk}, ${extendedStr})`;
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
}

module.exports = { ControlExecutor };
