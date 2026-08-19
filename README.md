# ReachInbox – Distributed Email Campaign Scheduler

A full-stack email campaign management platform with scheduling, rate-limiting, OAuth2, and attachment support.

## Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + TypeScript
- **Queue**: BullMQ (Redis)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT + Google OAuth2 + OTP

---

## 🚀 Deploy to Render (100% Free, No Credit Card Required)

We can deploy both the frontend and backend services to Render for free.

### Step 1: Create a Free Database & Redis
1. **Database**: Sign up at **[Neon.tech](https://neon.tech)** (free PostgreSQL). Create a project and copy the connection string:
   ```
   postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/reachinbox?sslmode=require
   ```
2. **Queue (Redis)**: Sign up at **[Upstash.com](https://upstash.com)** (free Redis). Create a Redis instance and copy the `rediss://...` connection URL.

### Step 2: Deploy to Render
1. Go to **[Render.com](https://render.render.com)** and sign in.
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `DABBARAMAHESH/Reach-Inbox`.
4. Render will read the `render.yaml` configuration and automatically set up two services:
   - **`reach-inbox-backend`** (Web Service running the Express API and BullMQ worker)
   - **`reach-inbox-frontend`** (Static Site hosting the React application)
5. Fill in the required environment variables in the dashboard setup:
   - `DATABASE_URL` (your Neon connection string)
   - `REDIS_URL` (your Upstash Redis URL)
   - `ENCRYPTION_KEY` (any 32-character random string)
   - `SYSTEM_SMTP_USER` (your Gmail address)
   - `SYSTEM_SMTP_PASSWORD` (your Google App Password)
6. Click **Approve**. Render will build and deploy both services!

> **Note**: For the frontend to communicate with the backend, update the destination route in the frontend's static route settings on the dashboard to point to your new backend URL.


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
