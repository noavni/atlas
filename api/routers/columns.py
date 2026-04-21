from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends

from api._core import lexorank
from api._core.auth import UserContext, require_user
from api._core.errors import NotFound
from api._core.models import Column, CreateColumn, RankRequest, UpdateColumn
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["columns"])


@router.get("/boards/{board_id}/columns", response_model=list[Column])
def list_columns(board_id: UUID, ctx: UserContext = Depends(require_user)) -> list[Column]:
    rows = (
        user_client(ctx.jwt)
        .table("columns")
        .select("*")
        .eq("board_id", str(board_id))
        .is_("deleted_at", "null")
        .order("rank")
        .execute()
    ).data or []
    return [Column.model_validate(r) for r in rows]


@router.post(
    "/boards/{board_id}/columns",
    response_model=Column,
    status_code=201,
)
def create_column(
    board_id: UUID,
    body: CreateColumn,
    ctx: UserContext = Depends(require_user),
) -> Column:
    client = user_client(ctx.jwt)
    board = (
        client.table("boards")
        .select("id, workspace_id")
        .eq("id", str(board_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not board:
        raise NotFound("board")

    tail = (
        client.table("columns")
        .select("rank")
        .eq("board_id", str(board_id))
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    rank = lexorank.between(tail[0]["rank"] if tail else None, None)

    payload = {
        "id": str(body.id or uuid4()),
        "board_id": str(board_id),
        "workspace_id": board[0]["workspace_id"],
        "name": body.name,
        "rank": rank,
        "default_workflow_state": body.default_workflow_state,
    }
    inserted = client.table("columns").insert(payload).execute().data[0]
    return Column.model_validate(inserted)


@router.patch("/columns/{column_id}", response_model=Column)
def update_column(
    column_id: UUID,
    body: UpdateColumn,
    ctx: UserContext = Depends(require_user),
) -> Column:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        rows = (
            user_client(ctx.jwt).table("columns").select("*").eq("id", str(column_id)).limit(1).execute()
        ).data or []
        if not rows:
            raise NotFound("column")
        return Column.model_validate(rows[0])
    rows = (
        user_client(ctx.jwt)
        .table("columns")
        .update(updates)
        .eq("id", str(column_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("column")
    return Column.model_validate(rows[0])


@router.post("/columns/{column_id}/rank", response_model=Column)
def rank_column(
    column_id: UUID,
    body: RankRequest,
    ctx: UserContext = Depends(require_user),
) -> Column:
    new_rank = lexorank.between(body.before, body.after)
    rows = (
        user_client(ctx.jwt)
        .table("columns")
        .update({"rank": new_rank})
        .eq("id", str(column_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("column")
    return Column.model_validate(rows[0])
