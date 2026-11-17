# DreamWall - AI Wallpaper Generator

A full-stack MERN (MongoDB, Express, React, Node.js) web application that empowers users to generate high-resolution custom wallpapers based on text prompts using generative AI, with user authentication and personal wallpaper galleries.

---

## Folder Structure

The project is structured with a decoupled **frontend** and **backend** architecture, optimized for independent deployment to **Vercel** and **Render**:

```
DREAMWALL/
├── frontend/               # React 18 Single Page Application (Deploy to Vercel)
│   ├── public/             # Static public assets (HTML, favicons)
│   ├── src/                # React components, styles, and API integrations
│   │   ├── App.js          # Core app component & dynamic API URL routing
│   │   ├── AppDesign.css   # Main stylesheet & themes
│   │   └── index.js        # React DOM entry point
│   ├── .env.example        # Environment variables template for frontend
│   ├── vercel.json         # Vercel configuration for SPA rewrites
│   └── package.json        # Frontend dependencies & scripts
│
├── backend/                # Express & Node.js REST API (Deploy to Render)
│   ├── models/             # Mongoose database models
│   │   ├── User.js         # User model with bcrypt password hashing
│   │   └── Wallpaper.js    # Wallpaper model with prompts & metadata
│   ├── uploads/            # Generated wallpaper images
│   ├── .env.example        # Environment variables template for backend
│   ├── render.yaml         # Render Blueprint configuration
│   ├── server.js           # Express server, CORS & REST endpoints
│   └── package.json        # Backend dependencies & scripts
│
├── BUILD_CLIENT.bat        # Helper script to build frontend production bundle
├── START_DEV.bat           # Helper script to start both dev servers concurrently
├── START_SERVER.bat        # Helper script to start backend server locally
├── DEPLOYMENT.md           # Step-by-step Vercel + Render deployment instructions
├── QUICK_START.md          # Local developer quick-start guide
└── package.json            # Root monorepo scripts (concurrent dev runner)
```

---

## Features

- **AI Generative Engines**:
  - **FLUX & Pollinations AI** (Default, free, high quality, no API keys required!)
  - **OpenAI DALL-E 3** (Optional via `OPENAI_API_KEY`)
  - **Hugging Face FLUX.1-schnell** (Optional via `HF_TOKEN`)
  - **Multiple Aspect Ratios**: 16:9 (Desktop), 9:16 (Phone), 1:1 (Square), 21:9 (Ultrawide)
- **User Authentication & Accounts**:
  - Sign up & Sign in with secure bcrypt password hashing and JWT sessions
  - Guest mode: visitors can generate wallpapers without signing in
  - User profiles with custom avatars and preferences
- **Personal & Community Gallery**:
  - Browse community creations and personal generation history
  - Direct 1-click downloads
- **Theming & Design**:
  - Dark/Light mode toggle
  - Responsive layout for desktop, tablets, and smartphones

---

## Local Development

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally (`mongodb://localhost:27017/wallpaperdb`) or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 2. Install Dependencies
From the root directory:
```bash
npm run install-all
```
*(Or install manually: `cd backend && npm install && cd ../frontend && npm install`)*

### 3. Configure Environment Variables
- Copy `backend/.env.example` to `backend/.env` and update values if needed:
  ```env
  PORT=5000
  MONGODB_URI=mongodb://localhost:27017/wallpaperdb
  JWT_SECRET=your_jwt_secret_key
  CLIENT_URL=http://localhost:3000
  ```
- Copy `frontend/.env.example` to `frontend/.env` (optional for local dev, defaults to `http://localhost:5000`):
  ```env
  REACT_APP_API_URL=http://localhost:5000
  ```

### 4. Run Locally
Run both backend and frontend concurrently:
```bash
npm run dev
```
*(On Windows, you can simply double-click `START_DEV.bat`)*

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## Deployment to Vercel & Render

For detailed step-by-step instructions with screenshots and MongoDB Atlas setup, see **[DEPLOYMENT.md](DEPLOYMENT.md)**.

### Quick Summary

#### Backend on Render:
1. Create a **Web Service** on [Render](https://render.com).
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Set Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas URI
   - `JWT_SECRET`: Random 32+ character secret
   - `CLIENT_URL`: `https://your-frontend.vercel.app` (optional, can be added after frontend deployment)

#### Frontend on Vercel:
1. Create a **New Project** on [Vercel](https://vercel.com).
2. Set **Framework Preset** to `Create React App`.
3. Set **Root Directory** to `frontend`.
4. Add Environment Variable:
   - `REACT_APP_API_URL`: Your Render backend URL (e.g., `https://dreamwall-backend.onrender.com`, NO trailing slash).
5. Click **Deploy**.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/` | API status and directory | No |
| `GET` | `/api/health` | Health and database status | No |
| `POST` | `/api/signup` | Register a new user | No |
| `POST` | `/api/signin` | Sign in with email and password | No |
| `POST` | `/api/generate-wallpaper` | Generate a wallpaper image from prompt | Optional |
| `GET` | `/api/wallpapers` | Fetch recent wallpapers gallery | No |
| `DELETE` | `/api/wallpapers/:id` | Delete a wallpaper | Bearer Token |
