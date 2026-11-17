# DreamWall Deployment Guide: Vercel (Frontend) & Render (Backend)

This guide walks you through deploying **DreamWall** with a separated architecture:
- **Frontend** (React Single Page App) deployed on **Vercel**
- **Backend** (Express / Node.js API) deployed on **Render**
- **Database** (MongoDB) hosted on **MongoDB Atlas**

---

## Architecture Overview

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│        Vercel (Frontend)        │       │         Render (Backend)        │
│  https://your-app.vercel.app    │ ----> │ https://your-backend.onrender...│
│                                 │       │                                 │
│  - React 18 SPA                 │       │  - Express.js API               │
│  - vercel.json SPA rewrites     │       │  - CORS enabled for Vercel      │
│  - REACT_APP_API_URL set        │       │  - REST Endpoints (/api/...)    │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                                           ▼
                                          ┌─────────────────────────────────┐
                                          │      MongoDB Atlas (Database)   │
                                          │  Users & Wallpaper Metadata     │
                                          └─────────────────────────────────┘
```

---

## Prerequisites

1. A [GitHub](https://github.com) account with this repository pushed to it.
2. A free [Render](https://render.com) account.
3. A free [Vercel](https://vercel.com) account.
4. A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (or another hosted MongoDB instance).

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a free **M0 Shared Cluster**.
3. **Database Access**:
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Create a user with password (e.g., `dreamwall_user` and a strong password).
4. **Network Access**:
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere (`0.0.0.0/0`)** so Render can connect.
5. **Get Connection String**:
   - Go to **Database > Clusters > Connect**.
   - Choose **Connect your application (Drivers: Node.js)**.
   - Copy the URI, replacing `<password>` with your database user password:
     ```
     mongodb+srv://dreamwall_user:<password>@cluster0.abcde.mongodb.net/wallpaperdb?retryWrites=true&w=majority
     ```

---

## Step 2: Deploy Backend to Render

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`DREAMWALL`).
4. Configure the Web Service settings:
   - **Name**: `dreamwall-backend` (or any name you choose)
   - **Region**: Choose the region closest to your users (e.g., `Oregon (US West)` or `Frankfurt (EU)`)
   - **Branch**: `main`
   - **Root Directory**: `backend` *(CRITICAL: do not leave empty!)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: `Free`
5. Click **Advanced** and add the following **Environment Variables**:

   | Key | Value | Description |
   |-----|-------|-------------|
   | `NODE_VERSION` | `20.0.0` | Recommended Node.js version |
   | `PORT` | `5000` | (Render sets PORT dynamically; 5000 is default fallback) |
   | `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI from Step 1 |
   | `JWT_SECRET` | `generate-a-strong-secret-key-32-chars` | Random string for auth tokens |
   | `CLIENT_URL` | `https://your-frontend.vercel.app` | Leave blank or set after Step 3 |
   | `OPENAI_API_KEY` | *(optional)* `sk-...` | Only needed if using DALL-E 3 engine |
   | `HF_TOKEN` | *(optional)* `hf_...` | Only needed if using Hugging Face engine |

6. Click **Deploy Web Service**.
7. Once deployed, note down your Render service URL, e.g.:
   ```
   https://dreamwall-backend.onrender.com
   ```
8. **Verify Backend**:
   - Open `https://dreamwall-backend.onrender.com/` in your browser.
     You should see:
     ```json
     {
       "name": "DreamWall AI Wallpaper Generator API",
       "status": "online",
       "database": "connected"
     }
     ```
   - Open `https://dreamwall-backend.onrender.com/api/health` to confirm database connectivity.

---

## Step 3: Deploy Frontend to Vercel

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New... > Project**.
3. Import your GitHub repository (`DREAMWALL`).
4. In the configuration window, configure:
   - **Project Name**: `dreamwall`
   - **Framework Preset**: `Create React App`
   - **Root Directory**: Click **Edit** and select `frontend` *(CRITICAL!)*
   - **Build and Output Settings**:
     - Build Command: `npm run build` (default)
     - Output Directory: `build` (default)
     - Install Command: `npm install` (default)
5. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://dreamwall-backend.onrender.com` *(your Render URL from Step 2, NO trailing slash)* |

6. Click **Deploy**.
7. Once the build finishes, Vercel gives you your production URL (e.g., `https://dreamwall.vercel.app`).

---

## Step 4: Finalize CORS on Render (Optional but Recommended)

Now that you have your Vercel URL:
1. Go back to your [Render Dashboard](https://dashboard.render.com/) > `dreamwall-backend` > **Environment**.
2. Add or update `CLIENT_URL`:
   - `CLIENT_URL` = `https://dreamwall.vercel.app` (your actual Vercel URL)
3. Click **Save Changes** (Render will automatically redeploy).

*(Note: The backend has fallback permissive CORS for `*.vercel.app` domains, but setting `CLIENT_URL` ensures optimal security in production.)*

---

## Step 5: Verification Checklist

- [ ] Visit frontend at `https://dreamwall.vercel.app`
- [ ] Create an account via **Sign Up**
- [ ] Log in via **Sign In**
- [ ] Generate a wallpaper (uses free Pollinations FLUX engine by default - no OpenAI key required!)
- [ ] View generated wallpaper in the **Gallery** tab
- [ ] Refresh any page in browser to confirm SPA routing works without 404 errors

---

## Troubleshooting & FAQ

### 1. "Network Error" or "Failed to fetch" on Frontend
- Check that `REACT_APP_API_URL` in Vercel has no trailing slash (`https://my-backend.onrender.com`).
- After changing environment variables in Vercel, you must trigger a **Redeploy** (Deployments > ... > Redeploy).
- Render's free tier spins down after 15 minutes of inactivity. The first request after sleep may take 30-50 seconds to wake up the server.

### 2. MongoDB Connection Error on Render
- In MongoDB Atlas, verify **Network Access** allows `0.0.0.0/0`.
- Verify the username and password in `MONGODB_URI`. If your password has special characters like `@` or `#`, URL-encode them.

### 3. Generated images disappear after Render restart
- On Render free tier, the local filesystem (`uploads/`) is ephemeral and resets on server restart.
- For long-term image persistence in production:
  - Configure a **Render Persistent Disk** attached to `/backend/uploads`.
  - Or integrate cloud storage like **Cloudinary** or **AWS S3**.
