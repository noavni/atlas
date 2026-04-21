from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends

from api._core import lexorank
from api._core.auth import UserContext, require_user
from api._core.errors import NotFound
from api._core.models import Board, CreateBoard
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["boards"])


@router.get("/projects/{project_id}/boards", response_model=list[Board])
def list_boards(project_id: UUID, ctx: UserContext = Depends(require_user)) -> list[Board]:
    rows = (
        user_client(ctx.jwt)
        .table("boards")
        .select("*")
        .eq("project_id", str(project_id))
        .is_("deleted_at", "null")
        .order("rank")
        .execute()
    ).data or []
    return [Board.model_validate(r) for r in rows]


@router.post(
    "/projects/{project_id}/boards",
    response_model=Board,
    status_code=201,
)
def create_board(
    project_id: UUID,
    body: CreateBoard,
    ctx: UserContext = Depends(require_user),
) -> Board:
    client = user_client(ctx.jwt)
    project = (
        client.table("projects")
        .select("id, workspace_id")
        .eq("id", str(project_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not project:
        raise NotFound("project")

    tail = (
        client.table("boards")
        .select("rank")
        .eq("project_id", str(project_id))
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    rank = lexorank.between(tail[0]["rank"] if tail else None, None)

    payload = {
        "id": str(body.id or uuid4()),
        "project_id": str(project_id),
        "workspace_id": project[0]["workspace_id"],
        "name": body.name,
        "rank": rank,
        "created_by": ctx.user_id,
    }
    inserted = client.table("boards").insert(payload).execute().data[0]
    return Board.model_validate(inserted)


@router.get("/boards/{board_id}", response_model=Board)
def get_board(board_id: UUID, ctx: UserContext = Depends(require_user)) -> Board:
    rows = (
        user_client(ctx.jwt)
        .table("boards")
        .select("*")
        .eq("id", str(board_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        raise NotFound("board")
    return Board.model_validate(rows[0])
