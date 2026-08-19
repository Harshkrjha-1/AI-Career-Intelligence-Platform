# AI-Powered Career Intelligence Platform

This is a production-ready AI-powered Career Intelligence Platform utilizing a FastAPI backend and a React/TypeScript frontend. It leverages spaCy NLP for resume parsing, Scikit-learn logic for cost-of-living adjusted salary estimations, and external OpenAI/Gemini connectors for resume analysis.

---

## 🏗️ Architecture & Component Design

The platform uses a decoupled full-stack architecture orchestrated with Docker:

```mermaid
graph TD
    Client[React Frontend] -->|HTTP / JSON| API[FastAPI Backend]
    API -->|Read/Write| DB[(PostgreSQL)]
    API -->|Enqueue Task| Redis[(Redis Broker)]
    Redis -->|Process Job| Worker[Celery Worker]
    Worker -->|Update Status| DB
    API -->|Request Analysis| LLM[Gemini / OpenAI API]
```

1. **Frontend**: Vite + React + TypeScript + Tailwind CSS styled with premium glassmorphism. Uses Recharts (Radar, Area, Bar) for dynamic visualization.
2. **Backend**: FastAPI with async router design, SQLAlchemy ORM for relational mapping, and bcrypt for passwords hashing.
3. **Database**: PostgreSQL with 14 schemas mapping profiles, skills, education, experience, and learning metrics.
4. **Queue Worker**: Celery worker mapping heavy parsing tasks.
5. **AI Service**: Custom NLP parsers and API connectors.

---

## 🔧 Environment Configurations

Create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:Harsh@localhost:5432/career_platform
JWT_SECRET_KEY=super-secret-key-change-in-production
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key
REDIS_URL=redis://localhost:6379/0
```

---

## 🚀 Getting Started

### Method 1: Local Development Setup

#### 1. Backend Server
```bash
cd backend
python -m venv venv
source venv/Scripts/activate # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Access Swagger UI documentation at `http://localhost:8000/docs`.

#### 2. Celery Worker (In another shell)
```bash
cd backend
celery -A app.tasks.celery_worker.celery_app worker --loglevel=info
```

#### 3. Frontend Client
```bash
cd frontend
npm install
npm run dev
```
Access the dashboard on `http://localhost:5173`.

### Method 2: Docker Compose (Production Setup)

Build and deploy all services (database, broker, server, worker, client) using a single command:
```bash
docker-compose up --build
```
Access the client dashboard on port `80` (mapped locally to `http://localhost`).

---

## 📡 API Routing Catalog

| Route | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Registers user and initializes Profile |
| `/api/auth/login` | `POST` | Public | Authenticates and returns JWT Access + Refresh tokens |
| `/api/auth/refresh` | `POST` | Public | Swaps valid Refresh token for new Access token |
| `/api/profile` | `GET` | User | Fetches user profile with full relational graph |
| `/api/profile/update` | `PUT` | User | Updates biographical and list entries |
| `/api/resume/upload` | `POST` | User | Handles file upload (PDF/DOCX) and triggers parsing |
| `/api/resume/parse` | `POST` | User | Forces synchronous parsing update |
| `/api/resume/evaluate` | `POST` | User | Returns ATS scoring and grammar suggestions |
| `/api/skills/gap-analysis`| `GET` | User | Compares skills and maps custom Roadmap |
| `/api/salary/predict` | `POST` | User | Predicts Cost-Of-Living adjusted compensation |
| `/api/jobs/recommend` | `GET` | User | Matches profile against jobs database |
| `/api/courses/recommend` | `GET` | User | Fetches course suggestions mapping missing skills |

---

## 🧪 Running Test Suites

Backend verification runs using `pytest`:
```bash
pytest backend/app/tests
```
