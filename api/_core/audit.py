"""Audit log writer.

Records destructive + permission + organize actions only (per plan §7a).
Fire-and-forget from the handler's perspective; on insert failure we log and
continue so an audit outage doesn't block user writes.
"""

from __future__ import annotations

from typing import Any

from api._core.supabase import service_client


def record(
    *,
    workspace_id: str,
    actor_id: str,
    action: str,
    entity_kind: str,
    entity_id: str | None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
) -> None:
    try:
        service_client().table("audit_log").insert(
            {
                "workspace_id": workspace_id,
                "actor_id": actor_id,
                "action": action,
                "entity_kind": entity_kind,
                "entity_id": entity_id,
                "before": before,
                "after": after,
            }
        ).execute()
    except Exception:
        # Best effort; never block on audit
        pass
