# Let's Clone Desktop Agent

A native desktop application that enables **actual mouse and keyboard control** on the host machine during remote sessions.

## Why Do You Need This?

Web browsers have security restrictions that prevent controlling the host's mouse and keyboard directly. This desktop agent:

1. Runs as a native Electron app on the host machine
2. Connects to your Let's Clone server via WebSocket
3. Receives control events from the viewer
4. **Actually executes** mouse movements, clicks, and keyboard inputs using `@nut-tree/nut-js`

## Prerequisites

- **Node.js 18+** (LTS recommended)
- **Windows**: No additional requirements
- **macOS**: Grant Accessibility permissions in System Preferences
- **Linux**: X11 display server (Wayland may have issues)

## Installation

1. **Navigate to the desktop-agent folder:**
   ```bash
   cd desktop-agent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the app:**
   ```bash
   npm start
   ```

## Building Distributable

To build the desktop agent for distribution:

```bash
# For Windows
npm run build:win

# For macOS
npm run build:mac

# For Linux
npm run build:linux
```

Built files will be in the `dist/` folder.

## Usage

### On the Host Machine:

1. **Start a host session** in the Let's Clone web app
2. **Copy your auth token** from browser's localStorage or the app settings
3. **Open the Desktop Agent** app
4. **Enter:**
   - Server URL (e.g., `http://localhost:5000` or your deployed backend URL)
   - The 6-digit session code
   - Your auth token (JWT)
5. **Click Connect**

### Getting Your Auth Token:

1. Open your browser's DevTools (F12)
2. Go to **Application** > **Local Storage**
3. Find the `auth-storage` key
4. Copy the `token` value from the stored JSON

Or, you can add a "Copy Token" button in your web app's settings page.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Viewer      │────▶│  Socket Server  │────▶│ Desktop Agent   │
│ (Web Browser)   │     │   (Backend)     │     │  (Host Machine) │
│                 │     │                 │     │                 │
│ Captures mouse/ │     │ Forwards events │     │ Executes actual │
│ keyboard events │     │ to host/agent   │     │ mouse/keyboard  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Viewer** captures mouse/keyboard events in the web browser
2. Events are sent via WebSocket to the **backend server**
3. Server forwards events to the **Desktop Agent** running on host
4. Desktop Agent uses `nut.js` to control the actual mouse/keyboard

## Control Event Types Supported

### Mouse Events
- `mousemove` - Move cursor to position
- `mousedown` - Press mouse button
- `mouseup` - Release mouse button
- `click` - Single click
- `dblclick` - Double click
- `contextmenu` - Right-click
- `scroll` - Mouse wheel scroll

### Keyboard Events
- `keydown` - Press key
- `keyup` - Release key
- All standard keys, modifiers (Ctrl, Shift, Alt, Meta), and function keys

## Permissions Required

### macOS
The app needs **Accessibility** permissions:
1. Go to **System Preferences** > **Security & Privacy** > **Privacy**
2. Click **Accessibility** in the left sidebar
3. Add and enable the Desktop Agent app

### Windows
- Usually works without special permissions
- May need to run as Administrator for some applications

### Linux
- Requires X11 (Wayland has limited support)
- May need `xdotool` installed: `sudo apt install xdotool`

## Troubleshooting

### "Mouse/keyboard not working"
1. Make sure the Desktop Agent is connected (green status)
2. Check if the host has granted control permissions
3. On macOS, verify Accessibility permissions are granted
4. Try running as Administrator (Windows)

### "Connection failed"
1. Verify the server URL is correct
2. Check your auth token is valid (not expired)
3. Make sure the session code matches an active session
4. Ensure the backend server is running

### "nut.js installation errors"
The `@nut-tree/nut-js` package requires native compilation:
```bash
# If you get errors, try:
npm rebuild
# or
npx electron-rebuild
```

## Security Considerations

⚠️ **Important**: This agent gives remote users full control of your mouse and keyboard!

- Only connect to **trusted** Let's Clone servers
- Only share session codes with **trusted** people
- The host can always stop sharing by closing the Desktop Agent
- Keep your auth token secret

## Development

```bash
# Run in development mode
npm start

# Watch for file changes
npm run dev
```

## Tech Stack

- **Electron** - Desktop app framework
- **@nut-tree/nut-js** - Cross-platform mouse/keyboard automation
- **socket.io-client** - Real-time communication
- **electron-store** - Persistent settings storage
