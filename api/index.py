"""Atlas FastAPI entry point.

Single Vercel Python function serving all /api/* routes. The app is mounted
under `root_path="/api"` so FastAPI generates correct OpenAPI paths while
Vercel's rewrite (/api/:path* -> /api/index) forwards the raw path.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.internal.worker_drain import router as worker_drain_router
from api.routers.health import router as health_router

app = FastAPI(
    title="Atlas API",
    version="0.0.0",
    # Vercel rewrites /api/:path* -> /api/index, so FastAPI needs to know the
    # public mount point to emit correct absolute URLs in OpenAPI.
    root_path="/api",
    docs_url="/docs",
    redoc_url=None,
)

# Same-origin via Vercel in production, cross-origin only for local dev.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Public meta
app.include_router(health_router)

# Internal (secret-protected)
app.include_router(worker_drain_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "atlas-api", "status": "ok"}
