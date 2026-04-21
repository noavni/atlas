from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field

from api._core import lexorank, pgmq
from api._core.auth import UserContext, require_user
from api._core.audit import record as audit_record
from api._core.errors import NotFound
from api._core.supabase import user_client

router = APIRouter(prefix="/v1/inbox", tags=["inbox"])


InboxKind = Literal["text", "voice", "image", "url", "file"]
InboxStatus = Literal["inbox", "processing", "processed", "archived", "trashed"]


class InboxItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    user_id: UUID
    kind: InboxKind
    raw_text: str | None = None
    transcript: str | None = None
    attachments: list[dict[str, Any]] = Field(default_factory=list)
    source: str | None = None
    status: InboxStatus
    organized_into_type: Literal["page", "card"] | None = None
    organized_into_id: UUID | None = None
    captured_at: datetime
    processed_at: datetime | None = None


class CaptureBody(BaseModel):
    workspace_id: UUID
    client_idempotency_key: str = Field(min_length=4, max_length=200)
    kind: InboxKind = "text"
    raw_text: str | None = None
    source: str | None = None
    attachments: list[dict[str, Any]] = Field(default_factory=list)


class OrganizeToCardBody(BaseModel):
    board_id: UUID
    column_id: UUID
    title: str | None = None


class OrganizeToNoteBody(BaseModel):
    title: str | None = None


# ---------------------------------------------------------------------------
@router.post("/capture", response_model=InboxItem, status_code=201)
def capture(body: CaptureBody, ctx: UserContext = Depends(require_user)) -> InboxItem:
    """Accept-and-ack capture. Persists one row and enqueues processing jobs."""
    client = user_client(ctx.jwt)

    existing = (
        client.table("inbox_items")
        .select("*")
        .eq("user_id", ctx.user_id)
        .eq("client_idempotency_key", body.client_idempotency_key)
        .limit(1)
        .execute()
    ).data or []
    if existing:
        return InboxItem.model_validate(existing[0])

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        "id": str(uuid4()),
        "workspace_id": str(body.workspace_id),
        "user_id": ctx.user_id,
        "kind": body.kind,
        "raw_text": body.raw_text,
        "attachments": body.attachments,
        "source": body.source,
        "status": "inbox",
        "captured_at": now,
        "client_idempotency_key": body.client_idempotency_key,
    }
    inserted = client.table("inbox_items").insert(payload).execute().data[0]

    # Fire-and-forget job enqueue — embedding now, transcription when wired.
    try:
        pgmq.send("embedding", {"kind": "inbox", "id": inserted["id"]})
        if body.kind == "voice":
            pgmq.send("transcription", {"id": inserted["id"]})
    except Exception:
        # Don't block capture on queue outage
        pass

    return InboxItem.model_validate(inserted)


@router.get("", response_model=list[InboxItem])
def list_inbox(
    workspace_id: UUID,
    status: InboxStatus | None = Query(default="inbox"),
    limit: int = Query(default=50, le=200),
    ctx: UserContext = Depends(require_user),
) -> list[InboxItem]:
    client = user_client(ctx.jwt)
    q = (
        client.table("inbox_items")
        .select("*")
        .eq("workspace_id", str(workspace_id))
        .eq("user_id", ctx.user_id)
        .is_("deleted_at", "null")
    )
    if status:
        q = q.eq("status", status)
    rows = q.order("captured_at", desc=True).limit(limit).execute().data or []
    return [InboxItem.model_validate(r) for r in rows]


# --- organize -------------------------------------------------------------
@router.post("/{item_id}/convert-to-card", response_model=InboxItem)
def convert_to_card(
    item_id: UUID,
    body: OrganizeToCardBody,
    ctx: UserContext = Depends(require_user),
) -> InboxItem:
    client = user_client(ctx.jwt)
    item = _require_item(client, item_id, ctx.user_id)

    column = (
        client.table("columns")
        .select("id, board_id, workspace_id, default_workflow_state")
        .eq("id", str(body.column_id))
        .limit(1)
        .execute()
    ).data or []
    if not column:
        raise NotFound("column")
    col = column[0]

    # Create card at tail of column
    tail = (
        client.table("cards")
        .select("rank")
        .eq("column_id", str(body.column_id))
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    rank = lexorank.between(tail[0]["rank"] if tail else None, None)

    title = body.title or (item.get("raw_text") or "Captured note")[:120]
    board = (
        client.table("boards").select("id, project_id").eq("id", col["board_id"]).limit(1).execute()
    ).data or []
    if not board:
        raise NotFound("board")

    card_id = str(uuid4())
    client.table("cards").insert(
        {
            "id": card_id,
            "workspace_id": col["workspace_id"],
            "project_id": board[0]["project_id"],
            "board_id": col["board_id"],
            "column_id": str(body.column_id),
            "title": title,
            "description": item.get("raw_text"),
            "workflow_state": col.get("default_workflow_state") or "todo",
            "rank": rank,
            "created_by": ctx.user_id,
        }
    ).execute()

    return _mark_processed(client, item, "card", card_id, ctx.user_id, "inbox.convert_to_card")


@router.post("/{item_id}/convert-to-note", response_model=InboxItem)
def convert_to_note(
    item_id: UUID,
    body: OrganizeToNoteBody,
    ctx: UserContext = Depends(require_user),
) -> InboxItem:
    client = user_client(ctx.jwt)
    item = _require_item(client, item_id, ctx.user_id)

    # Create a page with the capture as a paragraph
    tail = (
        client.table("pages")
        .select("rank")
        .eq("workspace_id", item["workspace_id"])
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    rank = lexorank.between(tail[0]["rank"] if tail else None, None)

    title = body.title or (item.get("raw_text") or "Untitled")[:80]
    raw = item.get("raw_text") or ""
    doc = {
        "type": "doc",
        "content": [
            {"type": "paragraph", "content": [{"type": "text", "text": raw}]} if raw else {"type": "paragraph"},
        ],
    }
    page_id = str(uuid4())
    client.table("pages").insert(
        {
            "id": page_id,
            "workspace_id": item["workspace_id"],
            "title": title,
            "content": doc,
            "rank": rank,
            "created_by": ctx.user_id,
        }
    ).execute()

    return _mark_processed(client, item, "page", page_id, ctx.user_id, "inbox.convert_to_note")


@router.post("/{item_id}/archive", response_model=InboxItem)
def archive_item(item_id: UUID, ctx: UserContext = Depends(require_user)) -> InboxItem:
    client = user_client(ctx.jwt)
    item = _require_item(client, item_id, ctx.user_id)
    rows = (
        client.table("inbox_items")
        .update({"status": "archived", "processed_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(item_id))
        .execute()
    ).data or []
    audit_record(
        workspace_id=item["workspace_id"],
        actor_id=ctx.user_id,
        action="inbox.archive",
        entity_kind="inbox_item",
        entity_id=str(item_id),
    )
    return InboxItem.model_validate(rows[0])


@router.post("/{item_id}/trash", response_model=InboxItem)
def trash_item(item_id: UUID, ctx: UserContext = Depends(require_user)) -> InboxItem:
    client = user_client(ctx.jwt)
    item = _require_item(client, item_id, ctx.user_id)
    rows = (
        client.table("inbox_items")
        .update({"status": "trashed", "processed_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(item_id))
        .execute()
    ).data or []
    audit_record(
        workspace_id=item["workspace_id"],
        actor_id=ctx.user_id,
        action="inbox.trash",
        entity_kind="inbox_item",
        entity_id=str(item_id),
    )
    return InboxItem.model_validate(rows[0])


@router.post("/{item_id}/restore", response_model=InboxItem)
def restore_item(item_id: UUID, ctx: UserContext = Depends(require_user)) -> InboxItem:
    client = user_client(ctx.jwt)
    item = _require_item(client, item_id, ctx.user_id, allow_non_inbox=True)
    rows = (
        client.table("inbox_items")
        .update({"status": "inbox", "processed_at": None})
        .eq("id", str(item_id))
        .execute()
    ).data or []
    return InboxItem.model_validate(rows[0])


# --- helpers --------------------------------------------------------------
def _require_item(
    client: Any, item_id: UUID, user_id: str, *, allow_non_inbox: bool = False
) -> dict[str, Any]:
    rows = (
        client.table("inbox_items")
        .select("*")
        .eq("id", str(item_id))
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        raise NotFound("inbox_item")
    return rows[0]


def _mark_processed(
    client: Any,
    item: dict[str, Any],
    kind: Literal["card", "page"],
    new_id: str,
    user_id: str,
    action: str,
) -> InboxItem:
    rows = (
        client.table("inbox_items")
        .update(
            {
                "status": "processed",
                "organized_into_type": kind,
                "organized_into_id": new_id,
                "processed_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        .eq("id", item["id"])
        .execute()
    ).data or []
    audit_record(
        workspace_id=item["workspace_id"],
        actor_id=user_id,
        action=action,
        entity_kind="inbox_item",
        entity_id=item["id"],
        after={"organized_into_type": kind, "organized_into_id": new_id},
    )
    return InboxItem.model_validate(rows[0])
