# Async Scoring System - EdTronaut Assessment

Asynchronous job processing system for submission scoring with queue-based architecture, built for scale and reliability.

## 🚀 Features

- **RESTful API** - Submission and scoring job management
- **Async Processing** - BullMQ queue with Redis backend
- **Idempotency** - Prevent duplicate job processing
- **Retry Mechanism** - 3 attempts with exponential backoff
- **Horizontal Scaling** - Multiple worker instances
- **OpenAPI 3.0 Docs** - Interactive Swagger UI
- **Structured Logging** - Winston with OpenTelemetry headers
- **Docker Ready** - One-command setup with docker-compose
- **Production Ready** - Error handling, graceful shutdown, health checks

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Design Decisions](#design-decisions)
- [Scalability](#scalability)
- [Future Improvements](#future-improvements)

## 🏗️ Architecture

### System Diagram

```
┌─────────────────┐
│     Client      │
└────────┬────────┘
         │ HTTP
         ▼
┌──────────────────────────────────────────────┐
│         API Server (Express.js)              │
│                                              │
│  ┌────────────────┐  ┌──────────────────┐  │
│  │  Submission    │  │   Scoring Job    │  │
│  │  Controller    │  │   Controller     │  │
│  └────────┬───────┘  └────────┬─────────┘  │
│           │                   │             │
│           └───────┬───────────┘             │
└───────────────────┼─────────────────────────┘
                    │
         ┌──────────┼──────────┐
         │          │          │
         ▼          ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │Prisma  │ │ Redis  │ │Winston │
    │Client  │ │ Queue  │ │ Logger │
    └───┬────┘ └───┬────┘ └────────┘
        │          │
        ▼          │
  ┌──────────┐    │
  │PostgreSQL│    │ Bull Queue
  │ Database │    │ (BullMQ)
  └──────────┘    │
                  ▼
         ┌────────────────────┐
         │  Scoring Workers   │
         │  (Background Jobs) │
         │                    │
         │  • Idempotency     │
         │  • Retry Logic     │
         │  • Concurrency: 5  │
         └─────────┬──────────┘
                   │
                   ▼
            ┌──────────────┐
            │  Scoring     │
            │  Logic       │
            │  Service     │
            └──────────────┘
```

### Async Scoring Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant DB as PostgreSQL
    participant Redis
    participant Worker

    Client->>API: POST /scoring {submissionId}
    API->>DB: Create ScoringJob (QUEUED)
    API->>Redis: Enqueue Job
    API-->>Client: 202 Accepted {job_id}

    Note right of API: Non-blocking response

    Worker->>Redis: Pick Job from Queue
    Worker->>DB: Update Status → RUNNING
    Worker->>Worker: Calculate Score (Heuristic)
    Worker->>DB: Update Status → DONE + Score

    Client->>API: GET /scoring/:id
    API->>DB: Query Job Status
    API-->>Client: {status: "DONE", score: 85}
```

### Request Flow

#### 1️⃣ **Submission Lifecycle**

```
POST /api/submissions
  → Create Submission (status: IN_PROGRESS)
  → Store with empty content: {source_code: "", documentation: ""}

PATCH /api/submissions/:id
  → Update content: {source_code: "...", documentation: "..."}
  → Can update multiple times while IN_PROGRESS

POST /api/submissions/:id/submit
  → Change status to SUBMITTED
  → Lock submission (no more edits allowed)
```

#### 2️⃣ **Scoring Job Flow**

```
POST /api/scoring
  → Validate: Submission must be SUBMITTED
  → Create ScoringJob (status: QUEUED)
  → Add job to Redis Queue (BullMQ)
  → Return job_id immediately (async processing)

Worker picks job from queue:
  → Update status to RUNNING
  → Calculate score using ScoringLogicService
  → Update status to DONE (with score & feedback)
  → OR status to ERROR (if failed after 3 retries)

GET /api/scoring/:id
  → Poll for job status and results
```

#### 3️⃣ **Data Flow**

```
Client → API → PostgreSQL (persist submission)
               ↓
            Redis Queue (enqueue scoring job)
               ↓
            Worker (consume job)
               ↓
            ScoringLogicService (calculate score)
               ↓
            PostgreSQL (update job results)
```

### Component Responsibilities

| Component                 | Responsibility                              | Technology          |
| ------------------------- | ------------------------------------------- | ------------------- |
| **API Server**            | Handle HTTP requests, validation, responses | Express.js          |
| **Submission Controller** | CRUD operations for submissions             | TypeScript          |
| **Scoring Controller**    | Create/query scoring jobs                   | TypeScript          |
| **Queue Client**          | Job enqueueing, retry config                | BullMQ + Redis      |
| **Scoring Worker**        | Async job processing                        | BullMQ Worker       |
| **Scoring Logic Service** | Calculate scores based on rubric            | Pure function       |
| **Database**              | Persistent storage                          | PostgreSQL + Prisma |
| **Logger**                | Structured logging with OpenTelemetry       | Winston             |

## 🛠️ Tech Stack

| Category       | Technology       | Version |
| -------------- | ---------------- | ------- |
| **Runtime**    | Node.js          | 22.x    |
| **Language**   | TypeScript       | 5.9.3   |
| **Framework**  | Express.js       | 5.1.0   |
| **Database**   | PostgreSQL       | 15+     |
| **ORM**        | Prisma           | 5.22.0  |
| **Queue**      | BullMQ + Redis   | 5.64.0  |
| **Validation** | Joi              | 18.0.2  |
| **Logging**    | Winston          | 3.18.3  |
| **Docs**       | Swagger UI       | 5.0.1   |
| **Container**  | Docker + Compose | Latest  |

---

## 🚦 Quick Start

### Prerequisites

- Node.js 22+
- Docker & Docker Compose (recommended)

### Option 1: Docker (Recommended) ⚡

```bash
# Clone repository
git clone https://github.com/Bigboss25-k22/edtronaut-assessment.git
cd edtronaut-assessment

# Start all services (PostgreSQL, Redis, API, Worker)
docker-compose up --build

# API: http://localhost:3000
# Docs: http://localhost:3000/docs
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit DATABASE_URL and REDIS_HOST in .env

# Start PostgreSQL + Redis
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7-alpine

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Terminal 1: Start API
npm run dev:api

# Terminal 2: Start Worker
npm run dev:worker
```

### Verify Installation

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}
```

## 📚 API Documentation

**Interactive Swagger UI:** `http://localhost:3000/docs`

### Core Endpoints

| Method | Endpoint                      | Description                |
| ------ | ----------------------------- | -------------------------- |
| POST   | `/api/submissions`            | Create new submission      |
| PATCH  | `/api/submissions/:id`        | Update submission content  |
| POST   | `/api/submissions/:id/submit` | Submit for scoring         |
| POST   | `/api/scoring`                | Create scoring job (async) |
| GET    | `/api/scoring/:id`            | Poll job status & results  |
| GET    | `/health`                     | Health check               |

### Status Flow

**Submission:** `IN_PROGRESS` → `SUBMITTED`  
**Scoring Job:** `QUEUED` → `RUNNING` → `DONE` / `ERROR`

### Quick Example

```bash
# 1. Create submission
POST /api/submissions {"learnerId": "user123", "simulationId": "sim456"}

# 2. Update content
PATCH /api/submissions/:id {"content": {"source_code": "..."}}

# 3. Submit
POST /api/submissions/:id/submit

# 4. Create scoring job
POST /api/scoring {"submissionId": ":id"} → Returns job_id

# 5. Poll results
GET /api/scoring/:job_id
```

---

## 🎯 Design Decisions

### 1. **Queue-Based Architecture (BullMQ + Redis)**

**Why?**

- Decouple API from heavy computation → Non-blocking responses
- Built-in retry with exponential backoff (2s, 4s, 8s)
- Horizontal scaling: Add workers without touching API
- Job persistence via Redis AOF/RDB

**Alternatives Considered:**

- RabbitMQ: Overkill, more complex setup
- AWS SQS: Vendor lock-in, higher latency (~100ms)
- In-memory queues: Cannot scale, lose jobs on restart

---

### 2. **PostgreSQL + Prisma ORM**

**Why?**

- ACID compliance → Reliable job state transitions
- JSON/JSONB support → Flexible content structure
- Prisma type safety → Fewer runtime errors
- Easy migrations and schema evolution

**Trade-off:** Downgraded Prisma v7 → v5 to avoid connection adapter requirement (simpler local dev)

---

### 3. **Idempotency Strategy**

**Implementation:**

```typescript
// Use DB-generated UUID as Redis job ID
await queue.add('score', data, { jobId: scoringJobId });

// Worker checks DB before processing
if (job.status === 'DONE' || job.status === 'RUNNING') {
  return; // Skip duplicate
}
```

**Why?** Prevents duplicate scoring if job retried or re-queued

---

### 4. **Scoring Logic (Mock Implementation)**

**Current Rubric:**

- Code Quality: 40% (structure, readability)
- Documentation: 30% (completeness, clarity)
- Performance: 30% (complexity analysis)

**Production Enhancement:**

- Integrate LLM APIs (GPT-4, Claude) for code review
- Add test case execution for correctness
- Use static analysis tools (ESLint scores, cyclomatic complexity)

---

### 5. **Content Structure: `{ source_code, documentation }`**

**Why JSON field?**

- Flexible schema (add fields without migration)
- No need to query inside content (only retrieve)
- Prisma `Json` type provides TypeScript safety

**Trade-off:** Cannot query by code patterns (acceptable for this use case)

---

### 6. **Structured Logging with OpenTelemetry Headers**

**Format:**

```json
{
  "level": "info",
  "message": "Job completed",
  "trace.id": "job-uuid",
  "span.kind": "consumer",
  "processing_duration_ms": 2340
}
```

**Why?** Easy integration with log aggregators (Elasticsearch, Datadog)

---

## 📊 Scalability

### Current Capacity (1 Worker, Concurrency=5)

- **Throughput:** 150 jobs/minute
- **Latency:** ~2s per job (P95)

### Horizontal Scaling Strategy

| Component      | Current         | Scale to 1M req/day | How                              |
| -------------- | --------------- | ------------------- | -------------------------------- |
| **API Server** | 1 instance      | 10+ instances       | Load balancer (NGINX, ALB)       |
| **Workers**    | 1 instance      | 100+ instances      | Kubernetes HPA, PM2 cluster      |
| **PostgreSQL** | Single node     | Primary + Replicas  | Read replicas, PgBouncer pooling |
| **Redis**      | Single instance | Redis Cluster       | 6+ node cluster with sharding    |

### Bottlenecks & Solutions

**1. Database Connections**

- Problem: Default pool = 10, exhausted at 100+ workers
- Solution: PgBouncer (10,000 app connections → 100 DB connections)

**2. Redis Memory**

- Problem: 10GB limit, 1M jobs × 5KB = 5GB
- Solution: Redis Cluster with 6 nodes (60GB capacity)

**3. Worker Processing Speed**

- Problem: 2s sleep simulates processing (30 jobs/min per worker)
- Solution: Remove sleep in production, add concurrency=10 (300 jobs/min)

**Expected Performance:**

- 100 workers × 300 jobs/min = **30,000 jobs/min** = **1.8M jobs/hour**

---

## 🔧 Configuration

**Environment Variables:**

```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/edtronaut

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Queue
QUEUE_NAME=scoring-queue
QUEUE_MAX_ATTEMPTS=3
QUEUE_BACKOFF_DELAY=2000
```

---

## 📁 Project Structure

```
src/
├── api/
│   ├── controllers/      # Request handlers
│   ├── routes/           # Express routes
│   ├── validations/      # Joi schemas
│   ├── middlewares/      # Error handling, validation
│   └── docs/             # OpenAPI specs
├── services/
│   ├── submission.service.ts
│   ├── scoring.service.ts
│   └── scoring-logic.service.ts
├── workers/
│   └── scoring.worker.ts
├── queue/
│   └── queue.client.ts   # BullMQ wrapper
├── db/
│   └── prisma.ts         # Prisma client
├── utils/
│   ├── logger.ts         # Winston logger
│   └── httpError.ts
├── config/
│   └── index.ts          # Environment config
└── index.ts              # API server entry
```

---

## 🚀 Future Improvements

### High Priority

**1. Worker Crash Tolerance**

- Add `lockDuration` and `lockRenewTime` to worker config
- Prevents job loss if worker crashes mid-processing

**2. Dead Letter Queue (DLQ)**

- Move failed jobs to separate queue after max retries
- Enable manual review of permanently failed jobs

**3. Rate Limiting**

- Implement Redis-backed rate limiter (e.g., 10 req/min per IP)
- Prevent DoS attacks and ensure fair usage

### Medium Priority

**4. JWT Authentication**

- Add JWT middleware for protected routes
- Enable user context tracking in logs

**5. Error Classification**

- Distinguish transient errors (network timeout) vs permanent (invalid data)
- Skip retries for permanent errors to fail fast

**6. Queue Retention Strategy**

- Keep completed jobs for 1 hour (audit trail)
- Keep failed jobs for 7 days (debugging)
- Prevent Redis memory bloat

### Low Priority

**7. Advanced Scoring**

- Integrate LLM APIs (GPT-4, Claude) for semantic code review
- Add test case execution for correctness
- Use static analysis tools (ESLint, SonarQube)

**8. Monitoring & Observability**

- Prometheus metrics (throughput, latency percentiles)
- Distributed tracing (Jaeger/Zipkin)
- Alerting for queue depth thresholds

**9. Database Optimization**

- Read replicas for GET endpoints
- PgBouncer connection pooling
- Add indexes on frequently queried columns

**10. Testing**

- Unit tests (Jest)
- Integration tests (Supertest)
- Load tests (k6, Artillery)

### Production Readiness Checklist

- [ ] Secrets in vault (AWS Secrets Manager, HashiCorp Vault)
- [ ] HTTPS/TLS with valid certificates
- [ ] CORS restricted to allowed origins
- [ ] Security headers (Helmet.js)
- [ ] Graceful shutdown with drain period
- [ ] Health checks for DB/Redis connectivity
- [ ] Centralized logging (Loki, Elasticsearch)
- [ ] Database backup strategy (daily snapshots)
- [ ] Disaster recovery plan documented
- [ ] Load balancer with health checks

---

## 📄 License

MIT License

## 👤 Author

**Bùi Chí Nam**  
Email: nambui250403@gmail.com  
GitHub: [@Bigboss25-k22](https://github.com/Bigboss25-k22)

---

## 🙏 Acknowledgments

EdTronaut Team for the assessment opportunity

---

**Note:** This is a demonstration project for backend assessment. Scoring logic is intentionally simplified to focus on system architecture, scalability, and reliability patterns.
