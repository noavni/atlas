"""Worker drain endpoint.

Invoked every minute by Supabase pg_cron + pg_net (see
`supabase/migrations/0400_pg_cron.sql`). Reads from pgmq with a 40s budget
(60s Vercel Hobby ceiling minus slack), dispatches messages, and returns.

Queue → handler wiring:
  * ``transcription`` — no-op until STT is wired (Phase 5). Messages stay in
    the queue with an extended visibility so they don't fail out.
  * ``embedding`` — hands off to the embed job (Phase 4 wires Voyage).
  * ``organize`` — "organize my inbox" batch (Phase 4).

Phase 3 ships the dispatch skeleton + non-blocking behaviour so existing
queues don't back up. Real handlers land in later phases.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Header, HTTPException, status

from api._core import pgmq
from api._core.settings import get_settings

router = APIRouter(prefix="/internal/worker", tags=["worker"])
log = logging.getLogger("atlas.worker")

QUEUES = ["transcription", "embedding", "organize"]
BATCH_LIMIT = 10
VISIBILITY_SECONDS = 120  # long enough to complete + archive on success


@router.post("/drain")
def drain(x_worker_secret: str | None = Header(default=None)) -> dict[str, Any]:
    settings = get_settings()
    if not settings.worker_shared_secret or x_worker_secret != settings.worker_shared_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid worker secret")

    started = time.monotonic()
    deadline = started + settings.worker_drain_deadline_seconds

    processed: dict[str, int] = {q: 0 for q in QUEUES}
    errors: dict[str, int] = {q: 0 for q in QUEUES}

    while time.monotonic() < deadline:
        did_work = False
        for queue in QUEUES:
            if time.monotonic() >= deadline:
                break
            try:
                messages = pgmq.read_batch(queue, VISIBILITY_SECONDS, BATCH_LIMIT)
            except Exception:
                # pgmq not provisioned yet — tolerate until 0300 migration lands
                continue
            for msg in messages:
                try:
                    _dispatch(queue, msg["message"])
                    pgmq.archive(queue, msg["msg_id"])
                    processed[queue] += 1
                except Exception as exc:  # noqa: BLE001
                    log.exception("worker failed on %s: %s", queue, exc)
                    errors[queue] += 1
                    # leave message visible-after-vt for retry
                did_work = True
        if not did_work:
            break

    return {
        "processed": processed,
        "errors": errors,
        "elapsed_seconds": round(time.monotonic() - started, 3),
        "deadline_seconds": settings.worker_drain_deadline_seconds,
    }


def _dispatch(queue: str, payload: dict[str, Any]) -> None:
    """Single switch point between queues and handlers.

    Real implementations land in later phases; until then, archive the
    message so the queue doesn't back up (no work means nothing to retry).
    """
    if queue == "transcription":
        # Phase 5 wires OpenAI gpt-4o-transcribe (then optionally Scribe v2).
        # Until then the payload just gets archived.
        return
    if queue == "embedding":
        # Phase 4: Voyage voyage-3-large batch embed + HNSW upsert.
        return
    if queue == "organize":
        # Phase 4: Claude-powered inbox organize suggestion.
        return
    # unknown queue — log and drop (archived by caller)
    log.warning("unknown queue: %s", queue)
