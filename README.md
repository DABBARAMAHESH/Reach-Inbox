# ReachInbox – Distributed Email Campaign Scheduler

A full-stack email campaign management platform with scheduling, rate-limiting, OAuth2, and attachment support.

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + TypeScript
- **Queue**: BullMQ (Redis)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + Google OAuth2 + OTP

---

## 🚀 Deploy to Hugging Face Spaces (Docker)

### Step 1: Get a Free PostgreSQL Database (Neon)
1. Go to **[https://neon.tech](https://neon.tech)** and sign up for free.
2. Create a new project (e.g. `reachinbox`).
3. Copy the **Connection String** — it looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/reachinbox?sslmode=require
   ```

### Step 2: Get a Free Redis (Upstash)
1. Go to **[https://upstash.com](https://upstash.com)** and sign up for free.
2. Create a new Redis database (choose **Global** for best latency).
3. Copy the **Redis URL** — it looks like:
   ```
   rediss://default:your_password@your-redis.upstash.io:6379
   ```

### Step 3: Create a Hugging Face Space
1. Go to **[https://huggingface.co/spaces](https://huggingface.co/spaces)**.
2. Click **Create new Space**.
3. Set:
   - **Space name**: `Reach-Inbox` (or any name)
   - **SDK**: `Docker`
   - **Visibility**: Public or Private
4. Click **Create Space**.

### Step 4: Connect Your GitHub Repo
In your HF Space settings:
1. Go to **Settings → Repository**.
2. Link to: `https://github.com/DABBARAMAHESH/Reach-Inbox`

### Step 5: Set Environment Variables (Secrets)
In your HF Space → **Settings → Variables and Secrets**, add:

| Secret Name | Value |
|-------------|-------|
| `DATABASE_URL` | Your Neon PostgreSQL connection string |
| `REDIS_URL` | Your Upstash Redis URL (`rediss://...`) |
| `JWT_SECRET` | Any long random string |
| `ENCRYPTION_KEY` | Exactly 32 characters |
| `SYSTEM_SMTP_USER` | Your Gmail address |
| `SYSTEM_SMTP_PASSWORD` | Your Google App Password |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://YOUR_HF_USERNAME-reach-inbox.hf.space/api/auth/google/callback` |
| `FRONTEND_URL` | `https://YOUR_HF_USERNAME-reach-inbox.hf.space` |
| `NODE_ENV` | `production` |

> See `.env.hf.example` for a full reference of all variables.

### Step 6: Deploy
After linking the repo and setting secrets, HF Spaces will automatically:
1. Pull your repo.
2. Build the Docker image (multi-stage build: frontend + backend).
3. Start nginx (port 7860) + Express API + BullMQ worker via supervisord.
4. Run Prisma migrations automatically on startup.

Your app will be live at:
```
https://YOUR_HF_USERNAME-reach-inbox.hf.space
```

---

## 🏠 Local Development

```bash
# Install dependencies
npm install

# Start PostgreSQL and Redis via Docker
docker-compose -f docker-compose.dev.yml up -d

# Copy env and configure
cp apps/backend/.env.example apps/backend/.env

# Run backend API
cd apps/backend && npm run dev

# Run email worker (separate terminal)
cd apps/backend && npm run worker

# Run frontend (separate terminal)
cd apps/frontend && npm run dev
```

Frontend: http://localhost:3001  
Backend API: http://localhost:5001  
Swagger Docs: http://localhost:5001/api/docs

---

## Features
- 📧 Bulk email campaigns with scheduling
- 📎 File/image attachments
- 🔄 OTP login (passwordless)
- 🔐 Google OAuth2 sign-in
- 📊 Real-time campaign analytics dashboard
- ⏱ Rate limiting (hourly limits, delays between sends)
- 🔁 Automatic retry with exponential backoff
- 📋 CSV / TXT / manual recipient list upload
