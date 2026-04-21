"""Atlas FastAPI entry point.

Single Vercel Python function serving all /api/* routes. The app is mounted
under `root_path="/api"` so FastAPI generates correct OpenAPI paths while
Vercel's rewrite (/api/:path* -> /api/index) forwards the raw path.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api._core.idempotency import IdempotencyMiddleware
from api.internal.worker_drain import router as worker_drain_router
from api.routers.attachments import router as attachments_router
from api.routers.boards import router as boards_router
from api.routers.cards import router as cards_router
from api.routers.columns import router as columns_router
from api.routers.graph import router as graph_router
from api.routers.health import router as health_router
from api.routers.inbox import router as inbox_router
from api.routers.leads import router as leads_router
from api.routers.me import router as me_router
from api.routers.organize import router as organize_router
from api.routers.pages import router as pages_router
from api.routers.projects import router as projects_router
from api.routers.search import router as search_router
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
app.include_router(inbox_router)
app.include_router(attachments_router)
app.include_router(search_router)
app.include_router(graph_router)
app.include_router(organize_router)
app.include_router(leads_router)

# Internal (secret-protected)
app.include_router(worker_drain_router)


log = logging.getLogger("atlas")


@app.exception_handler(Exception)
async def error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Private two-user app — log the full traceback server-side, ship a
    minimal shape to the client. We intentionally don't send stack traces
    to the browser in steady state."""
    log.exception("unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal",
            "message": str(exc),
            "type": type(exc).__name__,
        },
    )


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "atlas-api", "status": "ok"}
