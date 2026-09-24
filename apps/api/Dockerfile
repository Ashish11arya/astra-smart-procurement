# Multi-stage Dockerfile for ASTRA Backend API (apps/api)
FROM node:22-alpine AS builder

WORKDIR /app

# Copy root configurations and workspace definitions
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Install dependencies across workspaces
RUN npm ci

# Copy source code
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build shared package
RUN npm run build:shared

# Generate Prisma Client & Build API
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy built artifacts and production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package*.json ./apps/api/

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["node", "dist/main"]
