# 🚀 Deployment Guide - Let'sClone

This guide will help you deploy the Let'sClone application using:
- **MongoDB Atlas** - Database
- **Render** - Backend (Node.js + Socket.IO)
- **Vercel** - Frontend (React)

---

## 📋 Prerequisites

- GitHub account (with this repo pushed)
- MongoDB Atlas account
- Render account
- Vercel account

---

## Step 1: MongoDB Atlas Setup (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click **"Try Free"** and sign up

### 1.2 Create a Cluster
1. Click **"Build a Database"**
2. Choose **FREE - Shared** tier
3. Select a cloud provider (AWS recommended) and region closest to you
4. Click **"Create Cluster"** (takes 1-3 minutes)

### 1.3 Configure Database Access
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `letsclone`)
5. Click **"Autogenerate Secure Password"** and **SAVE THIS PASSWORD**
6. Under "Database User Privileges", select **"Read and write to any database"**
7. Click **"Add User"**

### 1.4 Configure Network Access
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, use specific IPs from Render
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Select **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your database user password
6. Add database name before the `?`:
   ```
   mongodb+srv://letsclone:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/letsclone?retryWrites=true&w=majority
   ```

**💾 Save this connection string - you'll need it for Render!**

---

## Step 2: Render Setup (Backend)

### 2.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended for easy repo access)

### 2.2 Create Web Service
1. From Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the `letsclone` repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `letsclone-backend` |
| **Region** | Choose closest to your users |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free |

### 2.3 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add these:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas connection string from Step 1.5 |
| `JWT_SECRET` | Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://YOUR-PROJECT.vercel.app` (update after Vercel deploy) |
| `SESSION_TIMEOUT_MS` | `14400000` |
| `SESSION_CODE_LENGTH` | `6` |

### 2.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (takes 2-5 minutes)
3. Once deployed, copy your Render URL (e.g., `https://letsclone-backend.onrender.com`)

**💾 Save your Render backend URL!**

---

## Step 3: Vercel Setup (Frontend)

### 3.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Sign up with GitHub (recommended)

### 3.2 Import Project
1. From Dashboard, click **"Add New..."** → **"Project"**
2. Import your GitHub repository (`letsclone`)
3. Configure the project:

| Setting | Value |
|---------|-------|
| **Project Name** | `letsclone` (or your choice) |
| **Framework Preset** | `Vite` |
| **Root Directory** | Click "Edit" → Select `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 3.3 Add Environment Variables
In the **"Environment Variables"** section, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://YOUR-RENDER-URL.onrender.com` |

Replace `YOUR-RENDER-URL` with your actual Render backend URL from Step 2.4.

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for deployment (takes 1-2 minutes)
3. Once deployed, copy your Vercel URL (e.g., `https://letsclone.vercel.app`)

---

## Step 4: Update CORS on Render

**IMPORTANT:** Now that you have your Vercel URL, update Render's CORS setting:

1. Go to your Render dashboard
2. Click on your `letsclone-backend` service
3. Go to **"Environment"** tab
4. Update `CORS_ORIGIN` to your Vercel URL (e.g., `https://letsclone.vercel.app`)
5. Click **"Save Changes"**
6. Render will automatically redeploy

---

## Step 5: Test Your Deployment

1. Open your Vercel URL in a browser
2. Try to register a new account
3. Log in and test the features

### Troubleshooting

**Backend not connecting:**
- Check Render logs: Dashboard → Your Service → Logs
- Verify MongoDB connection string is correct
- Ensure CORS_ORIGIN matches your Vercel URL exactly (no trailing slash)

**Frontend errors:**
- Check browser console (F12)
- Verify environment variables are set correctly
- Check Vercel deployment logs

**Socket.IO not connecting:**
- Render's free tier may sleep after inactivity
- First connection might take 30+ seconds to wake up
- Consider upgrading to paid tier for always-on service

---

## 🔧 Quick Commands Reference

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Check Backend Health
```bash
curl https://YOUR-RENDER-URL.onrender.com/api/health
```

---

## 📝 Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/letsclone?retryWrites=true&w=majority
JWT_SECRET=your-generated-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://your-app.vercel.app
SESSION_TIMEOUT_MS=14400000
SESSION_CODE_LENGTH=6
```

### Frontend (Vercel)
```
VITE_API_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## ⚠️ Important Notes

1. **Free Tier Limitations:**
   - Render free tier sleeps after 15 min of inactivity (first request takes ~30s)
   - MongoDB Atlas free tier has 512MB storage limit
   - Vercel free tier has 100GB bandwidth/month

2. **WebRTC Considerations:**
   - For production, consider adding TURN servers (e.g., Twilio, Xirsys)
   - Add these env vars to Render if needed:
     - `TURN_SERVER_URL`
     - `TURN_USERNAME`
     - `TURN_PASSWORD`

3. **Security:**
   - Never commit `.env` files to Git
   - Use strong, unique passwords
   - Consider upgrading to restrict MongoDB access to Render IPs only

---

## 🎉 Done!

Your Let'sClone application should now be live at your Vercel URL!

**Your URLs:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.onrender.com`
- Health Check: `https://your-backend.onrender.com/api/health`
