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
