# Deployment Guide: AI Job Hunter MVP

This guide outlines deployment options for the AI Job Hunter system, covering Docker Compose, Supabase PostgreSQL, Render, Railway, and Gmail OAuth configuration.

---

## 1. Quick Local Development Setup

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- App UI: `http://localhost:5173`

---

## 2. Docker Compose Deployment

The fastest way to deploy the entire stack (FastAPI Backend + React Frontend + PostgreSQL Database) locally or on a VPS (AWS EC2, DigitalOcean Droplet, Hetzner):

```bash
# In the repository root
docker compose up -d --build
```

- Frontend: `http://localhost:5173`
- Backend API & Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

---

## 3. Supabase PostgreSQL Configuration

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** -> **Database**.
3. Under **Connection string**, select **URI** (or Transaction Pooler).
4. Set the `DATABASE_URL` environment variable:
   ```env
   DATABASE_URL="postgresql+psycopg2://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require"
   ```
5. Run Alembic migrations:
   ```bash
   alembic upgrade head
   ```

---

## 4. Render / Railway Deployment

### Deploying Backend on Render / Railway
1. **Service Type**: Web Service (Docker or Python Environment).
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   - `DATABASE_URL`: Your Supabase or Railway PostgreSQL URL
   - `SECRET_KEY`: A secure 64-character random string
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend-domain.com"]`
   - `GOOGLE_CLIENT_ID`: (From Google Cloud Console)
   - `GOOGLE_CLIENT_SECRET`: (From Google Cloud Console)
   - `GOOGLE_REDIRECT_URI`: `https://your-frontend-domain.com/auth/gmail/callback`
   - `GEMINI_API_KEY` or `OPENAI_API_KEY`: (Optional)

### Deploying Frontend on Render / Vercel / Netlify
1. **Framework**: Vite
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-api.onrender.com/api/v1`

---

## 5. Gmail OAuth & API Credentials Setup

To enable 1-click cold email outreach through Gmail:

1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Create a project named **AI Job Hunter**.
3. Enable **Gmail API** in **APIs & Services** -> **Library**.
4. Go to **OAuth consent screen**:
   - User Type: **External**
   - Scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
     - `https://www.googleapis.com/auth/userinfo.email`
     - `openid`
5. Go to **Credentials** -> **Create Credentials** -> **OAuth Client ID**:
   - Application Type: **Web application**
   - Authorized JavaScript origins: `http://localhost:5173` (and your production frontend URL)
   - Authorized redirect URIs: `http://localhost:5173/auth/gmail/callback` (and your production redirect URL)
6. Copy `Client ID` and `Client Secret` into your `.env` file.
