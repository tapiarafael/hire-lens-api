# HireLens

<p align="center">
  <img src="hirelens.png" width="400" alt="HireLens Logo" />
</p>

<h1 align="center">HireLens</h1>

<p align="center">
  AI-powered Resume Analyzer and Job Compatibility Matching API<br/>
  Built with NestJS, Drizzle ORM, BullMQ, and OpenAI/Claude integrations.
</p>

---

## ✨ Overview

**HireLens** is a backend API designed to help candidates improve their resumes and evaluate their compatibility with job positions.

It supports:

- Uploading a resume (PDF file)
- AI-based resume analysis (strengths, weaknesses, suggestions)
- Fetching suggestions and improvement points
- Matching a resume against a job description URL
- Asynchronous job processing via queues (BullMQ)
- Pluggable storage and AI providers
- Scalable architecture for production use

---

## 🚀 Tech Stack

- **NestJS** — Node.js framework
- **Drizzle ORM** — Database access (PostgreSQL)
- **BullMQ** — Job queues and background processing
- **Pino** — Logging
- **OpenAI** / **Anthropic Claude** — AI providers (pluggable)
- **Prometheus (optional)** — Metrics-ready
- **Docker-ready** (optional)

---

## 📂 Project Structure

```bash
src/
├── ai/              # AI service abstraction (OpenAI, Claude, Ollama, etc.)
├── drizzle/         # Drizzle ORM setup (Postgres)
├── metrics/         # Metrics module for application monitoring
├── resume/          # Resume module: controllers, services, processors
├── storage/         # File storage abstraction (local, S3, etc.)
```

---

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone https://github.com/tapiarafael/hire-lens-api.git
cd hirelens-api
npm install
```

### 2. Create `.env` file

```bash
# .env

# Application
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hirelens
REDIS_URL=localhost
REDIS_PORT=6379

# Storage
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./storage

# AI Provider
AI_PROVIDER=anthropic # or openai
AI_API_KEY=your-openai-or-anthropic-api-key
AI_MAX_TOKENS_DEFAULT=1000

# https://jina.ai/reader/#apiform
JINA_API_TOKEN=jina-api-token
```

> **Note**: You can easily switch storage providers or AI providers by changing env vars.

---

## ▶️ Running the Project

### Run Migrations

Before running the project, ensure the database schema is up-to-date by running migrations:

```bash
npm run drizzle:migrate
```

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

### Test

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov
```

---

## 👋 API Endpoints

| Method |          Endpoint          | Description                                |
| :----: | :------------------------: | :----------------------------------------- |
|  POST  |         `/resume`          | Uploads a resume (PDF) and starts analysis |
|  GET   |       `/resume/:id`        | Get resume analysis results                |
|  POST  |     `/resume/:id/job`      | Analyze resume against a job URL           |
|  GET   | `/resume/job/:jobResumeId` | Get compatibility results for a job+resume |
|  GET   |         `/metrics`         | Get application metrics for Prometheus     |

---

## 🧠 Features

- **Resume Analyzer**: Uploads a PDF and uses LLMs to suggest improvements.
- **Job Compatibility**: Match a resume with a job description scraped from a URL.
- **Queues**: Background processing of heavy AI tasks via BullMQ.
- **Storage Abstraction**: Local, S3, etc.
- **AI Abstraction**: OpenAI, Claude, or custom LLMs.
- **Logging**: Pino integration for structured logs.
- **Metrics-Ready**: Easily integrate Prometheus if needed.

---

## 📈 Future Improvements

- Add retry and error handling for queue workers
- Deploy-ready Docker Compose for local and cloud
- Auto-scaling for background workers
- Multi-tenant support
- Authentication and authorization
- Rate limiting for API endpoints
- Caching for frequently accessed data
- SMTP integration for email notifications

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

Made with 💻 by Rafael Tapia — [LinkedIn](https://www.linkedin.com/in/rafael-tapia/)
