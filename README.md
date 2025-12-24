# Let'sClone(Remote Desktop clone)

A full-stack remote desktop web application that allows one user (Host) to share their screen and another user (Viewer) to view and remotely control the host's system in real-time.

## 🚀 Features

- **Secure Authentication** - JWT-based authentication with access and refresh tokens
- **Real-time Screen Sharing** - WebRTC-powered low-latency video streaming
- **Remote Control** - Mouse and keyboard control over the remote desktop
- **Device Management** - Register and manage multiple devices
- **Session Management** - Create, join, and track remote sessions
- **Responsive UI** - Modern, dark-themed interface built with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **React Router** - Client-side routing
- **WebRTC** - Peer-to-peer media streaming
- **Socket.IO Client** - Real-time communication

## 📁 Project Structure

```
remote-desktop/
├── backend/
│   ├── config/
│   │   ├── database.js      # MongoDB connection
│   │   ├── jwt.js           # JWT configuration
│   │   └── webrtc.js        # WebRTC/ICE server config
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── deviceController.js
│   │   └── sessionController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verification
│   │   └── validation.js    # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Device.js
│   │   └── Session.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── device.js
│   │   └── session.js
│   ├── sockets/
│   │   └── signaling.js     # WebRTC signaling server
│   ├── utils/
│   │   ├── helpers.js
│   │   └── logger.js
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── ConnectionStatus.jsx
    │   │   ├── DeviceCard.jsx
    │   │   ├── Input.jsx
    │   │   ├── Layout.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── RemoteScreen.jsx
    │   │   └── SessionCodeDisplay.jsx
    │   ├── hooks/
    │   │   ├── useRemoteControl.js
    │   │   ├── useSocket.js
    │   │   └── useWebRTC.js
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── HostSession.jsx
    │   │   ├── JoinSession.jsx
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Settings.jsx
    │   │   └── ViewerSession.jsx
    │   ├── services/
    │   │   ├── api.js        # Axios HTTP client
    │   │   └── socket.js     # Socket.IO client
    │   ├── store/
    │   │   ├── authStore.js
    │   │   ├── deviceStore.js
    │   │   └── sessionStore.js
    │   ├── webrtc/
    │   │   ├── controlHandler.js
    │   │   ├── screenCapture.js
    │   │   └── WebRTCManager.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.js
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB 6+ (local or MongoDB Atlas)
- Modern browser with WebRTC support (Chrome, Firefox, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/remote-desktop-clone.git
   cd remote-desktop-clone
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create environment file
   cp .env.example .env
   # Edit .env with your configuration
   
   # Start the server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start the development server
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

## ⚙️ Environment Variables

### Backend (.env)

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/remote-desktop

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔧 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register a new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/refresh | Refresh access token |
| GET | /api/auth/me | Get current user |
| PUT | /api/auth/me | Update user profile |
| PUT | /api/auth/change-password | Change password |
| POST | /api/auth/logout | Logout user |

### Devices
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/devices | Register a device |
| GET | /api/devices | Get user's devices |
| PUT | /api/devices/:deviceId | Update device |
| DELETE | /api/devices/:deviceId | Delete device |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/sessions | Create a session |
| POST | /api/sessions/join | Join a session |
| POST | /api/sessions/:sessionId/end | End a session |
| GET | /api/sessions/active | Get active sessions |
| GET | /api/sessions/history | Get session history |

## 🔌 Socket.IO Events

### Client → Server
| Event | Description |
|-------|-------------|
| device:register | Register device with socket |
| session:create | Create new session |
| session:join | Join existing session |
| session:end | End session |
| webrtc:offer | Send WebRTC offer |
| webrtc:answer | Send WebRTC answer |
| webrtc:ice-candidate | Send ICE candidate |
| control:event | Send control event |

### Server → Client
| Event | Description |
|-------|-------------|
| session:created | Session created successfully |
| session:joined | Session joined successfully |
| session:ended | Session ended |
| viewer:joined | Viewer joined session |
| webrtc:offer | Received WebRTC offer |
| webrtc:answer | Received WebRTC answer |
| webrtc:ice-candidate | Received ICE candidate |
| control:event | Received control event |
| peer:disconnected | Peer disconnected |

## 🖥️ How It Works

### 1. Host Screen Sharing
1. Host logs in and registers their device
2. Host creates a new session
3. System generates a unique 6-character session code
4. Host shares their screen using `getDisplayMedia()` API
5. WebRTC peer connection is prepared

### 2. Viewer Connection
1. Viewer logs in and enters the session code
2. Viewer joins the session
3. WebRTC signaling occurs through Socket.IO
4. Viewer receives the host's screen stream

### 3. Remote Control
1. Viewer's mouse/keyboard events are captured
2. Events are normalized and sent via WebRTC DataChannel
3. Host receives events and simulates them locally

## 🔐 Security Features

- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Password Hashing** - bcrypt with 12 salt rounds
- **Rate Limiting** - Prevent brute force attacks
- **CORS Protection** - Configured origin restrictions
- **Helmet.js** - HTTP security headers
- **Session Codes** - Random 6-character alphanumeric codes
- **Connection Encryption** - WebRTC uses DTLS encryption

## 🎨 UI Screenshots

### Dashboard
- Overview statistics
- Quick action buttons
- Device grid
- Session history

### Host Session
- Screen preview
- Session code display
- Connection status
- Control buttons

### Viewer Session
- Remote screen view
- Control toggle
- Connection stats
- Full-screen mode

## 📝 Development Notes

### Running in Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the dist folder with any static server
```

### Adding TURN Server

For production, add a TURN server to the WebRTC config in `backend/config/webrtc.js`:

```javascript
iceServers: [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.com:3478',
    username: 'username',
    credential: 'password'
  }
]
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [WebRTC](https://webrtc.org/) for real-time communication
- [Socket.IO](https://socket.io/) for signaling
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [React](https://reactjs.org/) for the UI framework
