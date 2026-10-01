import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from .api.routes import router as api_router

app = FastAPI(
    title="Redline Compliance Testing Engine",
    description="Deterministic compliance test bench evaluating conversational AI debt collection agents for context-dependent compliance.",
    version="1.0.0",
)

# Enable CORS for local development with Next.js/React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Static frontend serving if built
FRONTEND_DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "out")
if os.path.exists(FRONTEND_DIST_DIR):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST_DIR, html=True), name="static_frontend")
else:
    @app.get("/")
    def read_root():
        return {
            "name": "Redline Compliance API",
            "status": "running",
            "endpoints": {
                "docs": "/docs",
                "rules": "/api/rules",
                "scenarios": "/api/scenarios",
                "benchmark": "/api/benchmark",
                "custom_eval": "/api/evaluate/custom",
            },
            "disclaimer": "Redline is an independent prototype for demonstrating conversational compliance testing. Its scenarios and rules are simplified and are not legal advice or an evaluation of Veritus's systems.",
        }
