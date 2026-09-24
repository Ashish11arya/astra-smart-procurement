# Multi-stage Dockerfile for ASTRA Frontend (apps/web)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files and configurations
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

# Install dependencies across workspaces
RUN npm ci

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Build shared package
RUN npm run build:shared

# Build Next.js application
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output or public/static assets
COPY --from=builder /app/apps/web/package*.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["npm", "start"]
