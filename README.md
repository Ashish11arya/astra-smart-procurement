# ASTRA — Smart Farmer Procurement Coordination Platform

> **Status**: Phase 0 — Foundation & Architecture Setup (Active Development)

ASTRA is a full-stack platform designed for coordinating physical and virtual workflows in agricultural procurement operations. It connects farmers, procurement centres, quality assessors, weighbridge operators, disbursal systems, and government monitoring bodies into a coordinated, capacity-aware system.

---

## Technology Stack

- **Frontend**: Next.js (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, NestJS, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Fast / Ephemeral State**: Redis
- **Real-Time Communication**: WebSockets / Socket.IO (via NestJS Gateway)
- **Monorepo Management**: npm Workspaces
- **Containerization**: Docker & Docker Compose

---

## Architecture

ASTRA uses a modular monorepo structure separating frontend, backend, and shared typings:

```
astra-smart-procurement/
├── apps/
│   ├── api/                    # NestJS backend application
│   │   ├── prisma/             # Prisma schema and migrations
│   │   ├── src/
│   │   │   ├── config/         # App configuration
│   │   │   ├── database/       # Prisma service & database lifecycle
│   │   │   ├── health/         # Health check endpoint (GET /api/health)
│   │   │   ├── integrations/   # External provider interfaces & stub adapters
│   │   │   ├── modules/        # 15 modular domain skeletons
│   │   │   ├── realtime/       # WebSockets / Socket.IO gateway
│   │   │   └── redis/          # Redis service foundation
│   │   └── Dockerfile
│   └── web/                    # Next.js web application
│       ├── src/
│       │   └── app/            # App router & environment verification page
│       └── Dockerfile
├── packages/
│   └── shared/                 # Shared types, contracts, and UserRole enum
├── docs/
│   └── architecture.md         # System architecture specification
├── docker-compose.yml          # PostgreSQL, Redis, API, and Web services
├── .env.example                # Sanitized environment template
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

## Prerequisites

- **Node.js**: v20.x or v22.x or later (`node -v`)
- **npm**: v10.x or v11.x or later (`npm -v`)
- **PostgreSQL**: 16.x or 17.x (local service or Docker)
- **Redis**: 7.x (local service, WSL, or Docker)
- **Docker & Docker Compose** (Optional for local development, recommended for isolated setup)

---

## Local Setup

### 1. Clone & Configure Environment

```bash
# Clone the repository
git clone <repository-url>
cd Astra

# Create your local environment file
cp .env.example .env
```

Review `.env` and set your credentials:

```ini
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/astra_dev?schema=public
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secure_development_jwt_secret_min32chars
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

### 2. Install Dependencies

Install all dependencies across the monorepo from the root directory:

```bash
npm install
```

### 3. Generate Prisma Client

```bash
npm run prisma:generate
```

### 4. Build Shared Package

```bash
npm run build:shared
```

---

## Running Databases & Services

### Running PostgreSQL

#### Option A: Using Local PostgreSQL Service
If PostgreSQL is installed locally as a service:
1. Ensure the PostgreSQL service is active.
2. Create the development database:
   ```sql
   CREATE DATABASE astra_dev;
   ```
3. Update `DATABASE_URL` in `.env` with your username and password.

#### Option B: Using Docker Compose
Run only PostgreSQL in the background:
```bash
docker compose up -d postgres
```

---

### Running Redis

#### Option A: Using Docker Compose (Recommended)
Run only Redis in the background:
```bash
docker compose up -d redis
```

#### Option B: Local or WSL
Start Redis server:
```bash
redis-server
```

> **Note**: In development mode, if Redis is not active, the backend gracefully boots into a degraded/standby state and reports status via `/api/health`.

---

## Running the Applications

### How to Run the Backend (NestJS)

From the project root:

```bash
npm run dev:api
```

The API will start at:
- **Base API**: [http://localhost:3001/api](http://localhost:3001/api)
- **Health Check Endpoint**: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

### How to Run the Frontend (Next.js)

From the project root:

```bash
npm run dev:web
```

The frontend will start at:
- **Web App**: [http://localhost:3000](http://localhost:3000)

Open the browser to verify:
1. Frontend status indicates "Running".
2. Subsystem probes query `GET /api/health` and report live connection status for PostgreSQL, Redis, and WebSockets.

---

### Running the Entire Stack via Docker

To spin up all services (PostgreSQL, Redis, NestJS API, Next.js Web) simultaneously:

```bash
docker compose up --build
```

To stop all services:
```bash
docker compose down
```

---

## How to Run Tests & Verification

```bash
# Type check all packages and applications
npm run lint

# Build all packages and applications
npm run build

# Run tests across workspaces
npm test
```
