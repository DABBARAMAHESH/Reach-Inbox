# ReachInbox: Distributed Email Campaign Platform

A production-grade, highly idempotent full-stack email scheduling and delivery system built with **TypeScript**, **Express**, **React**, **PostgreSQL**, **Redis**, **BullMQ**, **Nodemailer**, and **Docker**.

Designed with strict application-level idempotency, Redis atomic hourly rate limiting, sender-level minimum delay coordination, Google OAuth 2.0, multi-sender Nodemailer/Ethereal integration, and a modern SaaS dashboard.

---

## 1. Architecture Overview

```
                 INTERNET
                     │
                     ▼
              ┌──────────────┐
              │   Frontend   │ (Nginx / Port 3000)
              │ React / Vite │
              └──────┬───────┘
                     │ REST API / HTTP-only Cookies
                     ▼
              ┌──────────────┐
              │   Backend    │ (Express App / Port 5000)
              │ API Services │
              └───┬──────┬───┘
                  │      │
                  ▼      ▼
           ┌─────────┐ ┌─────────┐
           │Postgres │ │  Redis  │
           │ DB (5432)│ │ (6379)  │
           └─────────┘ └────┬────┘
                             │
                             ▼
                       ┌──────────┐
                       │  BullMQ  │
                       │  Queue   │
                       └────┬─────┘
                            │
                            ▼
                       ┌──────────┐
                       │  Worker  │ (Node Process)
                       │ Container│
                       └────┬─────┘
                            │
                            ▼
                       ┌──────────┐
                       │ Ethereal │
                       │   SMTP   │
                       └──────────┘
```

---

## 2. Core Architectural Principles

### A. BullMQ Queue & Deterministic Scheduling
- **No Cron Jobs**: Scheduling is powered purely by **BullMQ delayed jobs** backed by Redis.
- **Deterministic Job IDs**: Every email record has a deterministic BullMQ job ID (`email-${emailId}`).
- **Restart Persistence**: Jobs are stored in Redis data volume (`redis_data`). If containers are stopped (`docker compose stop`) or restarted, future and delayed jobs remain intact and resume automatically.

### B. Redis Atomic Hourly Rate Limiting
- **Distributed Key**: `email-rate:{senderId}:{hourWindow}` (where `hourWindow` is formatted as `YYYYMMDD-HH`).
- **Atomic Operation**: Uses Redis `INCR` with 1-hour expiration.
- **Rescheduling on Limit Hit**: When a sender hits `MAX_EMAILS_PER_HOUR` (default `200`), the worker **does NOT drop or fail** the email. Instead, it calculates the remaining time until the next UTC hour window and reschedules the job using `job.moveToDelayed()`.

### C. Minimum Send Delay Coordination
- **Sender Lock Key**: `email-delay:{senderId}` storing timestamp of last email sent by that sender.
- **Multi-Worker Coordinated**: Enforces `MIN_DELAY_BETWEEN_EMAILS_MS` (default `2000ms`) across multiple concurrent worker containers.

### D. Strong Application-Level Idempotency
- **Pre-Send Verification**: Worker checks `email.status === 'sent'` in PostgreSQL before calling Nodemailer. If already sent, it exits immediately without re-sending.
- **Database Status Protection**: State transitions (`scheduled` &rarr; `processing` &rarr; `sent` / `failed`) are stored durably.

---

## 3. Technology Stack

- **Backend**: Node.js 20+, TypeScript, Express 4, PostgreSQL 16, Prisma ORM, Redis 7, ioredis, BullMQ v5, Nodemailer, Passport Google OAuth 2.0, Pino, Zod, Helmet, Multer, csv-parse, Swagger UI.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, TanStack Query v5, Axios, Lucide Icons, Sonner, Nginx.
- **Testing & Tooling**: Vitest, Supertest, Docker, Docker Compose.

---

## 4. Folder Structure

```
reachinbox-email-scheduler/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── auth/          # Passport Google OAuth Strategy
│   │   │   ├── config/        # Environment, Prisma, Redis, Logger configs
│   │   │   ├── controllers/   # Auth, Campaigns, Emails, Senders, Dashboard, Queue, Health
│   │   │   ├── lib/           # AES-256 Crypto & JWT helpers
│   │   │   ├── middleware/    # Auth, Error handler, Rate limit middleware
│   │   │   ├── queues/        # BullMQ queue & job data interfaces
│   │   │   ├── repositories/  # Database access layer
│   │   │   ├── routes/        # Express route definitions
│   │   │   ├── scripts/       # 1000 email load test seed utility
│   │   │   ├── services/      # Campaign, Mail, RateLimiter, CSV Parser services
│   │   │   ├── types/         # TypeScript interfaces & custom errors
│   │   │   ├── validators/    # Zod request validation schemas
│   │   │   ├── workers/       # BullMQ worker processor logic
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   ├── tests/             # Vitest unit & integration tests
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── frontend/
│       ├── src/
│       │   ├── api/           # Centralized Axios client
│       │   ├── components/    # UI & Layout components
│       │   ├── hooks/         # TanStack Query custom hooks
│       │   ├── pages/         # Login, Dashboard, Scheduled, Sent, Failed, Campaigns, Senders, Settings
│       │   ├── router/        # React Router with Auth Guard
│       │   ├── types/
│       │   ├── App.tsx
│       │   └── main.tsx
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── docker-compose.yml
├── docker-compose.dev.yml
├── .dockerignore
├── .gitignore
├── package.json
└── README.md
```

---

## 5. Quickstart & Docker Commands

### Prerequisites
- Node.js 20+
- Docker Desktop & Docker Compose
- Git

### 1. Launch All Services (Production Build)
```bash
docker compose up -d --build
```

### 2. Verify Container Health
```bash
docker compose ps
```
All 5 containers (`postgres`, `redis`, `backend`, `worker`, `frontend`) should report `healthy` / `running`.

### 3. Run Database Migrations
```bash
docker compose exec backend npx prisma migrate deploy
```

### 4. Access Frontend Application
Open your browser at: `http://localhost:3000`

### 5. Access Swagger API Documentation
Open your browser at: `http://localhost:5000/api/docs`

### 6. Container Management Commands
```bash
# View backend API logs
docker compose logs -f backend

# View worker logs
docker compose logs -f worker

# View Redis logs
docker compose logs -f redis

# View PostgreSQL logs
docker compose logs -f postgres

# Stop containers (preserves DB & Redis volumes)
docker compose stop

# Restart containers
docker compose start

# Stop and remove containers (preserves DB & Redis named volumes)
docker compose down
```

> [!CAUTION]
> Do NOT run `docker compose down -v` unless you explicitly want to purge PostgreSQL data and Redis BullMQ queues.

---

## 6. Environment Variables

Create `apps/backend/.env` (or let Docker use defaults from `.env.example`):

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=postgresql://reachinbox:reachinbox_password@postgres:5432/reachinbox

REDIS_HOST=redis
REDIS_PORT=6379

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

JWT_SECRET=super-secret-jwt-key-reachinbox-2026

SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=

WORKER_CONCURRENCY=5
MIN_DELAY_BETWEEN_EMAILS_MS=2000
MAX_EMAILS_PER_HOUR=200
MAX_CSV_SIZE_MB=5

FRONTEND_URL=http://localhost:3000
EMAIL_SEND_MODE=ethereal
LOG_LEVEL=info
```

> [!NOTE]
> If `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are not supplied, clicking **"Continue with Google"** or **"Quick Dev Login"** on the login page will automatically log in a pre-configured test user so you can test all features without set up.

---

## 7. Mandatory Restart Persistence & Docker Verification Procedure

To test that delayed BullMQ jobs and PostgreSQL data survive container restarts:

1. Launch Docker containers:
   ```bash
   docker compose up -d --build
   ```
2. Log in at `http://localhost:3000`.
3. Open **New Campaign**, upload a CSV file, set start time 2 minutes in the future, and click **Schedule Emails**.
4. Confirm scheduled jobs appear in **Scheduled Emails** table.
5. Stop backend and worker containers:
   ```bash
   docker compose stop backend worker
   ```
6. Wait 1 minute.
7. Restart containers:
   ```bash
   docker compose start backend worker
   ```
8. Observe that delayed jobs were **NOT lost**. The BullMQ worker resumes processing, delivers emails via Nodemailer, and updates status to **SENT**.

---

## 8. Automated Testing & Load Testing

### Run Backend Unit & Integration Tests
```bash
npm run test --workspace=apps/backend
```

### Run 1000+ Email Stress Test Seed Utility
```bash
docker compose exec backend npm run seed:1000
```
This utility enqueues 1000 emails in BullMQ to verify worker concurrency, Redis rate limit rescheduling, and non-blocking performance.

---

## 9. Failure Handling & Retry Policy

- **BullMQ Exponential Backoff**: Retries failed jobs up to 3 times (5s, 15s, 45s backoff).
- **Failure State Tracking**: On final attempt exhaustion, status is updated to `FAILED`, storing `attempts` count and exact `lastError` trace in PostgreSQL.
- **Idempotent Retry**: Clicking **Idempotent Retry** on the Failed Emails table resets email status to `scheduled` and re-enqueues a job in BullMQ without creating duplicate campaign records.

---

## 10. Architectural Trade-offs & Unavoidable Crash Window

> [!IMPORTANT]
> **Exactly-Once Delivery Trade-Off**:
> Exactly-once email delivery cannot be guaranteed by any application level logic alone because SMTP email delivery and database status commits are separate distributed systems.
>
> **The Unavoidable Crash Window**:
> 1. Worker sends email to Ethereal SMTP &rarr; SMTP accepts message.
> 2. Worker process or container crashes *before* executing PostgreSQL `UPDATE emails SET status = 'sent'`.
> 3. Upon container restart, BullMQ re-processes the job and may re-send the email.
>
> We mitigate this through strong application-level idempotency checks (`status === 'sent'` checks, deterministic job IDs, atomic status transitions).

---

## 11. 5-Minute Hiring Demo Walkthrough

1. Run `docker compose up -d --build` and open `http://localhost:3000`.
2. Click **Quick Dev Login**.
3. Go to **SMTP Senders** and click **Test Connection** on the default Ethereal sender.
4. Click **New Campaign**. Upload a sample CSV, set delay = 2s, hourly limit = 10, future start time.
5. Review the **Campaign Confirmation Screen** showing recipient breakdown and estimated completion time.
6. Click **Schedule Emails**.
7. Navigate to **Scheduled Emails** & **Dashboard** to see live BullMQ queue counts (`waiting`, `delayed`, `active`).
8. View emails transitioning to `SENT`. Click **View Preview** on any sent email to open the Ethereal email preview URL.
9. Execute container restart test: `docker compose stop backend worker` &rarr; wait &rarr; `docker compose start backend worker`. Verify jobs remain durable and finish cleanly!
