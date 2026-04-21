from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends

from api._core import lexorank
from api._core.audit import record as audit_record
from api._core.auth import UserContext, require_user
from api._core.errors import NotFound, VersionConflict
from api._core.models import Card, CreateCard, MoveCardRequest, UpdateCard, WorkflowState
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["cards"])


# --- reads ----------------------------------------------------------------
@router.get("/boards/{board_id}/cards", response_model=list[Card])
def list_cards(board_id: UUID, ctx: UserContext = Depends(require_user)) -> list[Card]:
    rows = (
        user_client(ctx.jwt)
        .table("cards")
        .select("*")
        .eq("board_id", str(board_id))
        .is_("deleted_at", "null")
        .order("rank")
        .execute()
    ).data or []
    return [Card.model_validate(r) for r in rows]


@router.get("/cards/{card_id}", response_model=Card)
def get_card(card_id: UUID, ctx: UserContext = Depends(require_user)) -> Card:
    rows = (
        user_client(ctx.jwt)
        .table("cards")
        .select("*")
        .eq("id", str(card_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        raise NotFound("card")
    return Card.model_validate(rows[0])


# --- writes ---------------------------------------------------------------
@router.post("/cards", response_model=Card, status_code=201)
def create_card(body: CreateCard, ctx: UserContext = Depends(require_user)) -> Card:
    client = user_client(ctx.jwt)
    col = (
        client.table("columns")
        .select("id, board_id, workspace_id, default_workflow_state")
        .eq("id", str(body.column_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not col:
        raise NotFound("column")
    column = col[0]

    board = (
        client.table("boards")
        .select("id, project_id")
        .eq("id", column["board_id"])
        .limit(1)
        .execute()
    ).data or []
    if not board:
        raise NotFound("board")

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

    state = body.workflow_state or column.get("default_workflow_state") or WorkflowState.todo
    payload = {
        "id": str(body.id or uuid4()),
        "workspace_id": column["workspace_id"],
        "project_id": board[0]["project_id"],
        "board_id": column["board_id"],
        "column_id": str(body.column_id),
        "title": body.title,
        "description": body.description,
        "workflow_state": state if isinstance(state, str) else state.value,
        "rank": rank,
        "assignee_id": str(body.assignee_id) if body.assignee_id else None,
        "due_at": body.due_at.isoformat() if body.due_at else None,
        "created_by": ctx.user_id,
    }
    inserted = client.table("cards").insert(payload).execute().data[0]
    return Card.model_validate(inserted)


@router.patch("/cards/{card_id}", response_model=Card)
def update_card(
    card_id: UUID,
    body: UpdateCard,
    ctx: UserContext = Depends(require_user),
) -> Card:
    client = user_client(ctx.jwt)
    current = (
        client.table("cards").select("*").eq("id", str(card_id)).is_("deleted_at", "null").limit(1).execute()
    ).data or []
    if not current:
        raise NotFound("card")
    row = current[0]
    if row["version"] != body.version:
        raise VersionConflict(current=row)

    updates: dict[str, object] = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.description is not None:
        updates["description"] = body.description
    if body.workflow_state is not None:
        updates["workflow_state"] = body.workflow_state.value
    if body.assignee_id is not None:
        updates["assignee_id"] = str(body.assignee_id)
    if body.due_at is not None:
        updates["due_at"] = body.due_at.isoformat()
    updates["version"] = row["version"] + 1

    rows = (
        client.table("cards")
        .update(updates)
        .eq("id", str(card_id))
        .eq("version", body.version)
        .execute()
    ).data or []
    if not rows:
        # Someone else bumped the version between our read and write — race.
        latest = (
            client.table("cards").select("*").eq("id", str(card_id)).limit(1).execute()
        ).data or []
        raise VersionConflict(current=latest[0] if latest else None)
    return Card.model_validate(rows[0])


@router.post("/cards/{card_id}/rank", response_model=Card)
def move_card(
    card_id: UUID,
    body: MoveCardRequest,
    ctx: UserContext = Depends(require_user),
) -> Card:
    client = user_client(ctx.jwt)
    current = (
        client.table("cards").select("*").eq("id", str(card_id)).is_("deleted_at", "null").limit(1).execute()
    ).data or []
    if not current:
        raise NotFound("card")
    row = current[0]
    if row["version"] != body.version:
        raise VersionConflict(current=row)

    new_rank = lexorank.between(body.before, body.after)
    updates = {
        "rank": new_rank,
        "column_id": str(body.column_id),
        "version": row["version"] + 1,
    }
    rows = (
        client.table("cards")
        .update(updates)
        .eq("id", str(card_id))
        .eq("version", body.version)
        .execute()
    ).data or []
    if not rows:
        latest = (client.table("cards").select("*").eq("id", str(card_id)).limit(1).execute()).data or []
        raise VersionConflict(current=latest[0] if latest else None)
    return Card.model_validate(rows[0])


@router.delete("/cards/{card_id}", status_code=204)
def delete_card(card_id: UUID, ctx: UserContext = Depends(require_user)) -> None:
    client = user_client(ctx.jwt)
    rows = (
        client.table("cards")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(card_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("card")
    audit_record(
        workspace_id=rows[0]["workspace_id"],
        actor_id=ctx.user_id,
        action="card.delete",
        entity_kind="card",
        entity_id=str(card_id),
        before=rows[0],
    )


@router.post("/cards/{card_id}/restore", response_model=Card)
def restore_card(card_id: UUID, ctx: UserContext = Depends(require_user)) -> Card:
    client = user_client(ctx.jwt)
    rows = (
        client.table("cards")
        .update({"deleted_at": None})
        .eq("id", str(card_id))
        .not_.is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("card")
    return Card.model_validate(rows[0])
