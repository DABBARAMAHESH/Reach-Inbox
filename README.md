# ReachInbox – Full-Stack Email Job Scheduler

A production-grade, distributed, and persistent email campaign scheduler built for the ReachInbox hiring assignment.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Vanilla CSS |
| **Backend** | Node.js, Express.js, TypeScript |
| **Queue** | BullMQ + Redis (Upstash cloud) |
| **Database** | PostgreSQL via Prisma ORM (Neon cloud) |
| **Auth** | Google OAuth2 + OTP (passwordless) |
| **Email** | Ethereal SMTP (test) + Gmail OAuth2 REST API (real) |

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- npm 9+
- A free [Neon PostgreSQL](https://neon.tech) account
- A free [Upstash Redis](https://upstash.com) account

### Step 1: Clone the Repository
```bash
git clone https://github.com/DABBARAMAHESH/Reach-Inbox.git
cd Reach-Inbox
npm install
```

### Step 2: Configure Environment Variables
```bash
cp apps/backend/.env.example apps/backend/.env
```
Edit `apps/backend/.env` with your values (see section below).

### Step 3: Run Database Migrations
```bash
cd apps/backend
npx prisma db push
cd ../..
```

### Step 4: Start All Services (3 separate terminals)

**Terminal 1 — Backend API (port 5001):**
```bash
npm run backend
```

**Terminal 2 — BullMQ Email Worker:**
```bash
npm run worker
```

**Terminal 3 — Frontend UI (port 3001):**
```bash
npm run frontend
```

Open **http://localhost:3001** in your browser.

---

## 🔑 Environment Variables

Create `apps/backend/.env` with the following keys:

```env
# Application
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3001

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Redis Queue (Upstash)
REDIS_URL=rediss://default:password@host:6379

# JWT Authentication
JWT_SECRET=your-long-random-secret-key

# Encryption (exactly 32 characters)
ENCRYPTION_KEY=your-32-char-encryption-key-here

# Google OAuth2 (for passwordless login + Gmail sending)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# System Fallback SMTP (Ethereal or Gmail with App Password)
# Used only for sending OTP codes, not campaigns
SYSTEM_SMTP_HOST=smtp.gmail.com
SYSTEM_SMTP_PORT=587
SYSTEM_SMTP_USER=your-gmail@gmail.com
SYSTEM_SMTP_PASSWORD=your-google-app-password

# Email Mode: 'ethereal' for fake test SMTP | 'smtp' for real sending
EMAIL_SEND_MODE=ethereal
```

### Setting Up Ethereal Email (Fake SMTP)
Ethereal is used for safe testing without sending real emails.
1. Set `EMAIL_SEND_MODE=ethereal` in your `.env`.
2. When the worker sends an email, the console will print a **preview URL** (e.g. `https://ethereal.email/message/...`).
3. Open that URL in your browser to view the full email content and attachments.

---

## 🏛️ Architecture Overview

```
┌─────────────────┐      ┌──────────────────┐      ┌────────────────┐
│  React Frontend │─────▶│  Express API      │─────▶│  PostgreSQL DB │
│  (Port 3001)    │      │  (Port 5001)      │      │  (Neon Cloud)  │
└─────────────────┘      └──────────────────┘      └────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │   BullMQ Queue   │
                          │  (Upstash Redis) │
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Standalone      │
                          │  Email Worker    │
                          └──────────────────┘
```

### How Scheduling Works
1. User submits a campaign via the frontend (recipients list, subject, body, attachments, start time, delay, hourly limit).
2. The backend API creates a `Campaign` record in PostgreSQL and a `Email` record for each recipient.
3. For each recipient, a **BullMQ delayed job** is enqueued with a delay calculated as:
   `startTime + (recipientIndex × delayBetweenEmails)`
4. The BullMQ worker (running as a separate process) picks up jobs when their delay expires and sends the email.
5. **No cron jobs are used at any point.** All scheduling is purely BullMQ delayed job execution.

### How Persistence on Restart is Handled
- **BullMQ jobs are stored in Redis**, not in memory. When the server or worker restarts, all pending and delayed jobs remain in Redis and will be picked up automatically when the worker reconnects.
- **Campaign and email states are stored in PostgreSQL.** The database tracks each email's status (`SCHEDULED`, `SENT`, `FAILED`) and `bullJobId`.
- **Idempotency** is enforced using a unique `idempotencyKey` (UUID per recipient) stored in the DB. Before sending, the worker checks this key to prevent duplicate sends if a job is accidentally replayed.
- **Result**: After a full server + worker restart, future scheduled emails still send at the correct times, with zero duplication.

### How Rate Limiting & Concurrency Are Implemented

#### Delay Between Emails
- Each email job is enqueued with an incremental delay:
  `delay = (recipientIndex × delayBetweenEmails)` milliseconds.
- Default minimum delay: **2000ms (2 seconds)** between individual sends.
- This is fully configurable by the user when creating a campaign.

#### Emails Per Hour (Rate Limiting)
- Each campaign stores a `hourlyLimit` value (e.g. 100 emails/hour).
- The worker checks a **Redis counter** keyed by `rate:sender_id:YYYY-MM-DD-HH` before sending each email.
- If the counter has reached the `hourlyLimit`, the job is **re-delayed** to the start of the next hour window using BullMQ's `moveToDelayed()`.
- Jobs are **never dropped or permanently failed** due to rate limiting — they are simply rescheduled.
- Redis-backed counters are **safe across multiple workers and instances** because Redis operations are atomic.

#### Worker Concurrency
- BullMQ worker is configured with a **concurrency level of 5** (5 emails processed in parallel).
- Configurable via the `WORKER_CONCURRENCY` environment variable.

#### Behavior Under Load (1000+ Emails)
- All 1000 jobs are enqueued as BullMQ delayed jobs immediately.
- They are processed in order by the workers.
- If hourly limits are reached, jobs are automatically cascaded into subsequent hour windows.
- The system will never block, crash, or drop jobs regardless of volume.

---

## ✅ Features Implemented

### Backend
| Feature | Status | Details |
|---------|--------|---------|
| Email scheduling via API | ✅ | POST `/api/campaigns` |
| BullMQ delayed job scheduling | ✅ | No cron, pure BullMQ |
| PostgreSQL persistence | ✅ | Prisma ORM + Neon |
| Survives server restarts | ✅ | Redis-backed queue state |
| Idempotency | ✅ | UUID `idempotencyKey` per recipient |
| Configurable delay between emails | ✅ | User-configurable per campaign |
| Hourly rate limiting (per sender) | ✅ | Redis counter + re-delay to next window |
| Rate limit safe across workers | ✅ | Atomic Redis operations |
| Worker concurrency | ✅ | Configurable, default 5 |
| Multiple senders support | ✅ | Each user has SMTP sender profiles |
| Ethereal Email (fake SMTP) | ✅ | Test mode with preview URLs |
| Gmail OAuth2 sending | ✅ | Real sending as the logged-in user |
| File attachments | ✅ | Base64 encoded, streamed to nodemailer |
| Swagger API docs | ✅ | `http://localhost:5001/api/docs` |

### Frontend
| Feature | Status | Details |
|---------|--------|---------|
| Google OAuth2 login | ✅ | Real OAuth, auto-registers sender |
| OTP passwordless login | ✅ | Email OTP flow |
| Dashboard with stats | ✅ | Total sent, scheduled, failed counts |
| Scheduled Emails tab | ✅ | Table with status, recipient, time |
| Sent Emails tab | ✅ | Shows sent time and delivery status |
| Compose Campaign modal | ✅ | Full form with all controls |
| Manual recipient entry | ✅ | Type comma-separated emails |
| CSV/TXT recipient upload | ✅ | Parses and counts email addresses |
| File attachment upload | ✅ | Images and documents |
| Flexible body validation | ✅ | Body OR attachment is sufficient |
| Delay & hourly limit controls | ✅ | Configurable per campaign |
| Loading states | ✅ | Skeletons and spinners |
| Empty states | ✅ | Illustrated empty views |
| Toast error notifications | ✅ | API error handling |
| Responsive layout | ✅ | Mobile + desktop |

---

## 📝 Assumptions, Shortcuts & Trade-offs

1. **Ethereal Mode**: By default (`EMAIL_SEND_MODE=ethereal`), emails are sent to Ethereal's fake SMTP and never reach real inboxes. Switch to `smtp` or `oauth2` mode with real credentials to send actual emails.
2. **Redis TTL on Rate Counters**: Rate limit Redis keys use a 2-hour TTL to auto-expire, keeping Redis memory clean.
3. **Attachment Size**: File attachments are base64-encoded and stored temporarily in memory (not on disk), with a 15MB payload limit enforced by both Express and Nginx.
4. **OTP Sender**: OTP emails are always sent via the system SMTP fallback (configured in `.env`), not via the user's own sender profile.
5. **Worker Restart Delay**: If a job was being actively processed when the worker crashed, BullMQ will return it to the queue after a stall timeout (default 30s) and retry it. Idempotency keys prevent double-sends.
