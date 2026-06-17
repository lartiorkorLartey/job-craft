# JobCraft

A full-stack job application assistant. Upload your master resume, save job descriptions, generate tailored resumes with AI, and track every application through a status pipeline.

---

## Features

- **Resume management** — upload your master resume (PDF or DOCX) and keep multiple versions
- **Job description storage** — save JDs by pasting text, providing a URL (auto-fetched), or uploading a file
- **AI resume generator** — produces a tailored resume, ATS compatibility score, and improvement suggestions using any LLM provider
- **ATS tester** — score a resume against a JD before sending it out
- **Application tracker** — log applications and move them through a status pipeline (Applied → Phone Screen → Offer → etc.)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6 |
| Backend | Node.js, Express |
| Database | PostgreSQL via Prisma ORM |
| Auth | JWT (7-day expiry) |
| File parsing | `pdf-parse`, `mammoth` |
| AI | Any OpenAI-compatible provider + Anthropic (auto-detected) |

---

## Project Structure

```
job-app-tool/
├── client/                  # React frontend
│   └── src/
│       ├── api/             # Axios instance + all API calls
│       ├── components/      # Shared UI (Layout, StatusBadge, etc.)
│       ├── contexts/        # AuthContext (JWT storage + user state)
│       └── pages/           # Dashboard, Resumes, Jobs, Applications, ResumeGenerator
├── server/                  # Express backend
│   ├── prisma/
│   │   └── schema.prisma    # User, Resume, Job, Application models
│   ├── scripts/
│   │   └── seed.js          # Creates a test user
│   └── src/
│       ├── lib/
│       │   ├── prisma.js    # Prisma client singleton
│       │   └── llm.js       # Provider-agnostic LLM wrapper
│       ├── middleware/
│       │   └── auth.js      # JWT requireAuth middleware
│       └── routes/
│           ├── auth.js      # /api/auth — register, login, me
│           ├── resumes.js   # /api/resumes — upload, list, delete
│           ├── jobs.js      # /api/jobs — create, list, delete
│           ├── applications.js  # /api/applications — CRUD + status update
│           └── generator.js # /api/generator — generate, test-ats
└── package.json             # Root scripts (runs client + server concurrently)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL

### 1. Install dependencies

```bash
npm install              # root (Jest + concurrently)
npm install --prefix client
npm install --prefix server
```

### 2. Configure the server

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/jobcraft"
JWT_SECRET="your-long-random-secret"
PORT=5000

# Add your LLM key — see the AI Configuration section below
LLM_API_KEY=""
```

### 3. Set up the database

```bash
# Create the database
psql -U <your-pg-user> -c "CREATE DATABASE jobcraft;"

# Run migrations
cd server && npx prisma migrate dev --name init

# Seed a test user
npm run seed
```

The seed creates:
- **Email:** `test@jobcraft.dev`
- **Password:** `password123`

### 4. Start the app

```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: http://localhost:5000

---

## AI Configuration

The generator works with any LLM provider. The provider is auto-detected from the key prefix, or you can set it explicitly.

**Auto-detected prefixes:**

| Key prefix | Provider |
|---|---|
| `sk-ant-…` | Anthropic (Claude) |
| `gsk_…` | Groq |
| `sk-…` | OpenAI |

**Or set `LLM_PROVIDER` explicitly** in `server/.env`:

```env
# Anthropic
LLM_API_KEY="sk-ant-..."

# OpenAI
LLM_API_KEY="sk-..."

# Groq (free tier available at console.groq.com)
LLM_API_KEY="gsk_..."

# Mistral
LLM_API_KEY="your-key"
LLM_PROVIDER="mistral"

# Local Ollama (no key needed)
LLM_PROVIDER="ollama"
LLM_MODEL="llama3"
# LLM_BASE_URL="http://localhost:11434/v1"  # default
```

**Optional overrides:**

| Variable | Purpose |
|---|---|
| `LLM_MODEL` | Override the default model for the chosen provider |
| `LLM_BASE_URL` | Custom endpoint (required for `ollama`/`custom`) |

**No API key?** The app falls back to a mock generator that uses keyword overlap to produce an ATS score and suggestions, so you can test the full UI flow without any LLM setup.

---

## API Reference

All routes are prefixed with `/api`. Protected routes require `Authorization: Bearer <token>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Get JWT token |
| GET | `/auth/me` | ✓ | Current user |

### Resumes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/resumes` | ✓ | List uploaded resumes |
| POST | `/resumes` | ✓ | Upload resume (PDF/DOCX, max 10 MB) |
| DELETE | `/resumes/:id` | ✓ | Delete resume + file |

### Job Descriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/jobs` | ✓ | List saved JDs |
| POST | `/jobs` | ✓ | Save JD (text, URL, or file upload) |
| DELETE | `/jobs/:id` | ✓ | Delete JD |

### Applications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/applications` | ✓ | List applications |
| POST | `/applications` | ✓ | Log new application |
| PATCH | `/applications/:id` | ✓ | Update status or notes |
| DELETE | `/applications/:id` | ✓ | Remove application |

**Application statuses:** `Applied` · `Phone Screen` · `Technical Interview` · `Onsite` · `Offer` · `Accepted` · `Rejected` · `Withdrawn`

### Generator

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/generator/generate` | ✓ | Generate tailored resume + ATS score + suggestions |
| POST | `/generator/test-ats` | ✓ | Score resume against JD |

**Request body for both:**
```json
{ "resumeId": "...", "jobId": "..." }
```

**Generate response:**
```json
{
  "success": true,
  "data": {
    "atsScore": 74,
    "suggestions": [
      { "type": "highlight", "text": "Emphasise your experience with TypeScript..." },
      { "type": "missing",   "text": "The JD mentions Kubernetes but it's not in your resume..." }
    ],
    "content": "Jane Doe\n..."
  }
}
```

---

## Dev Commands

| Command | Description |
|---|---|
| `npm run dev` | Start client (port 3000) + server (port 5000) concurrently |
| `npm run dev:client` | Frontend only |
| `npm run dev:server` | Backend only |
| `npm test` | Run Jest test suite |
| `cd server && npx prisma studio` | Open database GUI |
| `cd server && npm run seed` | Create test user |
| `cd server && npx prisma migrate dev` | Apply schema changes |
