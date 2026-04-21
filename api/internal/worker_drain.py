"""Worker drain endpoint.

Invoked every minute by Supabase pg_cron + pg_net. Reads from pgmq, processes
as many jobs as it can under a 40s budget (60s Vercel Hobby ceiling minus
slack), re-enqueues unfinished messages, returns.

Phase 0: stub. Real job dispatch lands in Phase 3.
"""

from __future__ import annotations

import time

from fastapi import APIRouter, Header, HTTPException, status

from api._core.settings import get_settings

router = APIRouter(prefix="/internal/worker", tags=["worker"])


@router.post("/drain")
def drain(x_worker_secret: str | None = Header(default=None)) -> dict[str, object]:
    settings = get_settings()
    if not settings.worker_shared_secret or x_worker_secret != settings.worker_shared_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid worker secret")

    started = time.monotonic()
    deadline = started + settings.worker_drain_deadline_seconds

    # Phase 0 stub: no queues exist yet. Real implementation reads pgmq in
    # a loop with a per-iteration deadline check.
    processed = 0
    while time.monotonic() < deadline:
        # placeholder: break immediately until pgmq is wired up in Phase 3
        break

    return {
        "processed": processed,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "deadline_seconds": settings.worker_drain_deadline_seconds,
    }
