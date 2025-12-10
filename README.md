# ReFocused Platform: Master Architecture & Documentation

**Live Project:** [refocused.app](https://refocused.app)

---

## Project Overview

ReFocused is a comprehensive productivity ecosystem designed to consolidate daily tools—Pomodoro, journaling, habit tracking, and study aids—into a single, cohesive application. Beyond standard CRUD, each component is engineered for scale, security, and extensibility.

This repository documentation covers the entire stack:

- **Cloud & DevOps:** AWS Serverless & Container Architecture  
- **Frontend:** Next.js 15 Client  
- **Backend:** FastAPI Async Server  
- **AI Pipeline:** Custom GPT-NeoX Training & Fine-tuning  

---

## 1. Cloud Architecture & DevOps (AWS)

The ReFocused infrastructure is built on a high-availability, hybrid serverless/container architecture hosted primarily on AWS. It leverages a Virtual Private Cloud (VPC) for security and AWS Lambda functions for scalable compute.

### Infrastructure Breakdown

#### A. Core Application Hosting

- **Frontend (AWS Amplify):** Hosting for the Next.js application, utilizing Route 53 for DNS management (client and server).
- **Backend (AWS App Runner):** Core FastAPI backend as a containerized service.
- **ECR (Elastic Container Registry):** Stores Docker images for App Runner.
- **VPC Connector:** Enables secure communication between App Runner and private database/cache layers inside the VPC.

#### B. The "Refocused-VPC" (Network Layer)

Critical data services are isolated within a custom VPC:

- **Public Subnet:**
  - **EC2 NAT Instance:** Provides private resources outbound internet access without inbound exposure.
  - **Internet Gateway:** Manages inbound/outbound traffic.

- **Private Subnet:**
  - **Amazon RDS:** PostgreSQL database for persistent user data.
  - **ElasticCache for Redis:** Session, caching, and rate limiting.

#### C. Serverless Microservices Architecture

Some features are offloaded to Lambda/API Gateway for scalable compute:

- **Email Service:**
  - **Trigger:** API Gateway.
  - **Flow:** SNS Topics trigger decoupled Lambdas.
  - **Storage:** Reads/modifies DynamoDB.
  - **Action:** SES dispatch for email.

- **AI Inference Engine:**
  - **Compute:** Dedicated ai-handler Lambda.
  - **Model Loading:** From S3 and ECR.
  - **Persistence:** DynamoDB for history/prompts.

- **Feedback & Feature Voting:**
  - Gateways trigger Lambdas, data written to DynamoDB for performance and isolation.

---

## 2. Frontend (Client)

Highly iterated, responsive web app built to consolidate productivity apps.

### Tech Stack

- **Core:** Next.js 15.2 (App Router), React 19, TypeScript 5.7
- **State/Data:** TanStack React Query 5, Context API (Auth, Time, Audio)
- **Styling:** Tailwind CSS 4, Framer Motion, Lucide React
- **Key Libs:** Quill (Rich Text), date-fns, bcryptjs, Google OAuth

### Key Features

- **Pomodoro Timer:** 100ms refresh, local persistence, stats.
- **Habit Tracking:** Streaks, calendar, analytics.
- **Journal:** Encrypted rich-text entries, password protection.
- **Study System:** Flashcard sets, spaced repetition, progress tracking.
- **Breathing Exercises:** SVG animations for guided techniques.

### Performance & Architecture

- **State Management:** Pure Context API + Hooks; specialized contexts (Auth, Time, AiConversation).
- **Optimistic Updates:** React Query with cache invalidation (stale: 5 min).
- **Daily Caching:** useDailyCache hook resets at midnight UTC.

---

## 3. Backend API ([Mahdi-196/ReFocused-backend](https://github.com/Mahdi-196/ReFocused-backend))

Asynchronous, high-performance API built with FastAPI. Targets sub-100ms response times and massive scalability.

### Tech Stack

- **Framework:** FastAPI 0.104, Uvicorn (ASGI)
- **Language:** Python 3.11
- **Database:** PostgreSQL (AsyncPG + SQLAlchemy 2.0)
- **Caching:** Redis (Asyncio)
- **Security:** OAuth2 (Google), JWT (HS256/RS256), Passlib (Bcrypt)
- **Observability:** OpenTelemetry, Sentry, Prometheus

### Security Implementation

- **Authentication:** Hybrid HTTP-Only Cookies (primary), JWT Bearer (fallback)
- **Token Management:** Silent refresh (every 15s), blacklist on logout, auto-logout

- **Protection Layers:**
  - **Rate Limiting:** Token bucket (global: 500/min, AI endpoints: 50/day)
  - **CSRF:** Double-submit cookie pattern
  - **Headers:** HSTS, CSP, X-Frame-Options

### Scalability

- **DB Pooling:** Managed via AsyncPG
- **Redis Caching:** Sessions, counters, daily content (midnight reset)
- **Middleware:** Security, GZip compression, structured logging

---

## 4. ReFocused AI ([Mahdi-196/ReFocused-AI](https://github.com/Mahdi-196/ReFocused-AI))

Custom-trained 1.2B Parameter Language Model (GPT-NeoX architecture) powers productivity features.

### Pipeline Overview

- **Data Collection:** Reddit, Wikipedia (real-time)
- **Processing:** Deduplication, quality scoring, balanced splits
- **Tokenization:** Custom BPE (GPT-2 style)
- **Training:**
  - **Framework:** PyTorch 2.0+ with CUDA
  - **Optimization:** Mixed precision, torch.compile
  - **Infra:** Checkpoint uploads to Google Cloud Storage
- **Fine-Tuning:** LoRA and full fine-tuning (Chat, Code, Instruction)

### Model Stats

- **Arch:** GPT-NeoX
- **Parameters:** ~1.2B
- **Context Window:** 2048 tokens
- **Vocab:** 50,257 tokens
- **Deployment:** Weights exported to S3, loaded into Lambda for inference

---

## Setup & Usage

The AI repository provides a full CLI for managing the pipeline:

```bash
# Start training with the test config
./start_training.sh --config test --gcs-credentials keys.json

# Fine-tune for chat
python 06_fine_tuning/fine_tune.py --task chat --base-model final_model
```
