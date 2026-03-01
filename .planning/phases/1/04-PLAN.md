---
phase: 1
plan: 4
wave: 2
depends_on: ["1.1"]
files_modified:
  - backend/main.py
  - backend/requirements.txt
  - backend/Dockerfile
  - backend/railway.toml
  - backend/.env.example
autonomous: false

must_haves:
  truths:
    - "FastAPI server starts locally with `uvicorn main:app --reload`"
    - "GET /health returns { status: 'ok', version: '1.0.0' } with HTTP 200"
    - "CORS middleware allows requests from localhost:5173 and the Vercel production domain"
    - "Railway auto-deploy is configured (railway.toml or Procfile present)"
  artifacts:
    - "backend/main.py exists with FastAPI app, /health endpoint, CORS middleware"
    - "backend/requirements.txt has fastapi, uvicorn[standard], python-dotenv"
    - "backend/Dockerfile exists for Railway containerized deploy"
    - "backend/railway.toml or Procfile with start command"
    - "backend/.env.example documents required env vars (ALLOWED_ORIGINS)"
  key_links:
    - "/health liveness probe is what Railway monitors for deploy success"
    - "CORS config must explicitly list Vercel domain — wildcard '*' breaks credentialed requests"

user_setup:
  - service: railway
    why: "Cloud backend hosting for FastAPI"
    dashboard_config:
      - task: "Create a new Railway project and link to the GitHub repo (backend/ directory)"
        location: "railway.app → New Project → Deploy from GitHub Repo → Configure root directory to 'backend/'"
      - task: "Set environment variable ALLOWED_ORIGINS to your Vercel frontend URL"
        location: "Railway Dashboard → Project → Variables → Add ALLOWED_ORIGINS=https://your-app.vercel.app"
      - task: "Enable 'Deploy on Push' for the main branch"
        location: "Railway Dashboard → Project → Settings → Deployments"
---

# Plan 1.4: FastAPI Backend Skeleton

<objective>
Create a minimal FastAPI backend that is Railway-deployable and verified with a /health endpoint. This establishes the React ↔ FastAPI connection early, per DECISIONS.md, and serves as the scaffold for cloud simulation (Phase 3/6) and hardware submission (Phase 7).

Purpose: Getting the backend live early validates the full deploy pipeline and proves the frontend can reach the backend before any business logic is added. Phase 1 Success Criterion 5 explicitly requires this.
Output: FastAPI app at backend/, deployable to Railway, returning { status: 'ok' } from /health.
</objective>

<context>
Load for context:
- .planning/DECISIONS.md (Decision 1: Full-stack from Day 1, Decision 5: Railway platform-native CI/CD)
- .planning/ROADMAP.md (Phase 1 Success Criterion 5)
</context>

<tasks>

<task type="auto">
  <name>Create FastAPI app with /health endpoint and CORS</name>
  <files>
    backend/main.py
    backend/requirements.txt
    backend/.env.example
  </files>
  <action>
    1. Create `backend/requirements.txt`:
    ```
    fastapi>=0.115.0
    uvicorn[standard]>=0.30.0
    python-dotenv>=1.0.0
    ```

    2. Create `backend/.env.example`:
    ```
    # Allowed CORS origins (comma-separated)
    ALLOWED_ORIGINS=http://localhost:5173,https://your-app.vercel.app
    ```

    3. Create `backend/main.py`:
    ```python
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from dotenv import load_dotenv
    import os

    load_dotenv()

    app = FastAPI(title="Quantum Studio API", version="1.0.0")

    # CORS — load from env, never hardcode production URLs
    allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in allowed_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict:
        return {"status": "ok", "version": app.version}

    # Placeholder routes for future phases
    @app.post("/simulate")
    async def simulate_placeholder():
        return {"status": "not_implemented", "message": "Cloud simulation available in Phase 6"}
    ```
    AVOID: Do NOT use `allow_origins=["*"]` — this breaks credentialed fetch requests from the frontend (cookies, Authorization headers needed in Phase 7).
    AVOID: Do NOT hardcode the Vercel URL in source — use ALLOWED_ORIGINS env var for all origins.
  </action>
  <verify>
    1. `cd backend && pip install -r requirements.txt`
    2. `uvicorn main:app --reload`
    3. `curl http://localhost:8000/health` → `{"status":"ok","version":"1.0.0"}`
  </verify>
  <done>`curl http://localhost:8000/health` returns 200 with the JSON body above. No import errors on startup.</done>
</task>

<task type="auto">
  <name>Create Dockerfile and railway.toml for Railway deployment</name>
  <files>
    backend/Dockerfile
    backend/railway.toml
  </files>
  <action>
    1. Create `backend/Dockerfile`:
    ```dockerfile
    FROM python:3.12-slim

    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt

    COPY . .

    EXPOSE 8080

    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
    ```

    2. Create `backend/railway.toml`:
    ```toml
    [build]
    builder = "dockerfile"
    dockerfilePath = "backend/Dockerfile"

    [deploy]
    startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT"
    healthcheckPath = "/health"
    healthcheckTimeout = 30
    restartPolicyType = "on_failure"
    ```
    Note: Railway injects $PORT at runtime — do NOT hardcode port 8080 in the start command.
    AVOID: Do NOT use python:3.12 (full image) — use python:3.12-slim to keep Railway deploy under 500MB.
  </action>
  <verify>
    Local Docker build test (optional but recommended):
    `docker build -t quantum-studio-api ./backend`
    `docker run -p 8080:8080 quantum-studio-api`
    `curl http://localhost:8080/health` → returns { status: 'ok' }
  </verify>
  <done>Dockerfile builds without errors. railway.toml specifies /health as healthcheck path.</done>
</task>

<task type="checkpoint:human-action">
  <name>Deploy to Railway and verify live /health endpoint</name>
  <files></files>
  <action>
    Follow the user_setup instructions to deploy to Railway:
    1. railway.app → New Project → Deploy from GitHub Repo
    2. Set root directory to `backend/`
    3. Add env var: ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
    4. Enable Deploy on Push for main branch
    5. After deploy completes, visit https://your-railway-app.up.railway.app/health
  </action>
  <verify>Browser shows `{"status":"ok","version":"1.0.0"}` at the Railway-provided HTTPS URL.</verify>
  <done>Railway URL is live. Copy the Railway URL for use in frontend env vars (VITE_API_BASE_URL).</done>
</task>

</tasks>

<verification>
After all tasks, verify:
- [ ] `curl http://localhost:8000/health` → 200 `{"status":"ok","version":"1.0.0"}`
- [ ] `backend/main.py` uses `os.getenv("ALLOWED_ORIGINS")` — no hardcoded URLs
- [ ] `backend/Dockerfile` uses `python:3.12-slim`
- [ ] `railway.toml` has `healthcheckPath = "/health"`
- [ ] Railway deploy succeeds (green checkmark in Railway dashboard)
</verification>

<success_criteria>
- [ ] All tasks verified
- [ ] Must-haves confirmed
- [ ] Railway backend URL is live and accessible from a browser
- [ ] Phase 1 Success Criterion 5 is met
</success_criteria>
