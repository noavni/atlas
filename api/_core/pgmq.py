"""Thin wrappers around the Supabase ``pgmq`` extension.

We expose ``send``, ``read_batch``, ``archive``, and ``delete``. The
service-role client bypasses RLS (internal worker path) — never route user
traffic through these functions.
"""

from __future__ import annotations

from typing import Any

from api._core.supabase import service_client


def send(queue: str, payload: dict[str, Any], delay_seconds: int = 0) -> int:
    """Enqueue a message. Returns the message id."""
    res = service_client().rpc(
        "pgmq_send",
        {"queue_name": queue, "msg": payload, "delay": delay_seconds},
    ).execute()
    return int(res.data)


def read_batch(queue: str, visibility_seconds: int = 30, limit: int = 10) -> list[dict[str, Any]]:
    """Read up to ``limit`` messages, marking them invisible for
    ``visibility_seconds``. Returns a list of rows shaped
    ``{msg_id, read_ct, enqueued_at, vt, message}``.
    """
    res = service_client().rpc(
        "pgmq_read",
        {"queue_name": queue, "vt": visibility_seconds, "qty": limit},
    ).execute()
    return res.data or []


def archive(queue: str, msg_id: int) -> bool:
    """Move the message to the queue's archive table (audit trail)."""
    res = service_client().rpc("pgmq_archive", {"queue_name": queue, "msg_id": msg_id}).execute()
    return bool(res.data)


def delete(queue: str, msg_id: int) -> bool:
    res = service_client().rpc("pgmq_delete", {"queue_name": queue, "msg_id": msg_id}).execute()
    return bool(res.data)
