"""Atlas FastAPI entry point.

Single Vercel Python function serving all /api/* routes. The app is mounted
under `root_path="/api"` so FastAPI generates correct OpenAPI paths while
Vercel's rewrite (/api/:path* -> /api/index) forwards the raw path.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api._core.idempotency import IdempotencyMiddleware
from api.internal.worker_drain import router as worker_drain_router
from api.routers.boards import router as boards_router
from api.routers.cards import router as cards_router
from api.routers.columns import router as columns_router
from api.routers.health import router as health_router
from api.routers.me import router as me_router
from api.routers.pages import router as pages_router
from api.routers.projects import router as projects_router
from api.routers.workspaces import router as workspaces_router

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
app.add_middleware(IdempotencyMiddleware)

# Public meta
app.include_router(health_router)

# User-facing v1 surface
app.include_router(me_router)
app.include_router(workspaces_router)
app.include_router(projects_router)
app.include_router(boards_router)
app.include_router(columns_router)
app.include_router(cards_router)
app.include_router(pages_router)

# Internal (secret-protected)
app.include_router(worker_drain_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "atlas-api", "status": "ok"}
