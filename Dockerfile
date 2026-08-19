# ─────────────────────────────────────────────
# Stage 1: Build the React frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

# Install frontend dependencies
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./
RUN npm ci --silent

# Copy source and build
COPY apps/frontend/ .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2: Build the Express backend
# ─────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /build/backend

# Install backend dependencies (including dev for TypeScript)
COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm ci --silent

# Copy source and compile TypeScript → JavaScript
COPY apps/backend/ .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 3: Final production image
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

# Install nginx and supervisord
RUN apk add --no-cache nginx supervisor

# ── Backend ──────────────────────────────────
WORKDIR /app/backend

# Copy compiled backend JS
COPY --from=backend-builder /build/backend/dist ./dist

# Copy Prisma schema and generate client
COPY apps/backend/prisma ./prisma

# Install production dependencies only
COPY apps/backend/package.json apps/backend/package-lock.json* ./
RUN npm ci --omit=dev --silent && npx prisma generate

# ── Frontend (nginx) ──────────────────────────
# Copy React build output to nginx html directory
COPY --from=frontend-builder /build/frontend/dist /usr/share/nginx/html

# ── Configuration ─────────────────────────────
# nginx config for HF Spaces (port 7860)
COPY nginx.hf.conf /etc/nginx/http.d/default.conf

# supervisord config (manages nginx + backend + worker)
COPY supervisord.conf /etc/supervisord.conf

# Create required log/run directories
RUN mkdir -p /var/log/supervisor /var/run

# ── Hugging Face Spaces port ──────────────────
EXPOSE 7860

# ── Entrypoint ───────────────────────────────
# Run Prisma migrations then start all services via supervisord
CMD ["sh", "-c", "cd /app/backend && npx prisma migrate deploy && supervisord -c /etc/supervisord.conf"]
