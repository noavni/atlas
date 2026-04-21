from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from api._core.auth import UserContext, require_user
from api._core.errors import NotFound
from api._core.models import Workspace
from api._core.supabase import user_client

router = APIRouter(prefix="/v1/workspaces", tags=["workspaces"])


class CreateWorkspace(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)


@router.get("", response_model=list[Workspace])
def list_workspaces(ctx: UserContext = Depends(require_user)) -> list[Workspace]:
    rows = (
        user_client(ctx.jwt)
        .table("workspaces")
        .select("id, name, owner_id, created_at, updated_at")
        .is_("deleted_at", "null")
        .order("created_at")
        .execute()
    ).data or []
    return [Workspace.model_validate(r) for r in rows]


@router.post("", response_model=Workspace, status_code=201)
def create_workspace(body: CreateWorkspace, ctx: UserContext = Depends(require_user)) -> Workspace:
    client = user_client(ctx.jwt)
    payload = {
        "id": str(body.id or uuid4()),
        "name": body.name,
        "owner_id": ctx.user_id,
        "created_by": ctx.user_id,
    }
    inserted = client.table("workspaces").insert(payload).execute().data[0]
    # Self-add as owner member so RLS gates work immediately.
    client.table("workspace_members").insert(
        {"workspace_id": inserted["id"], "user_id": ctx.user_id, "role": "owner"}
    ).execute()
    return Workspace.model_validate(inserted)


@router.get("/{workspace_id}", response_model=Workspace)
def get_workspace(workspace_id: UUID, ctx: UserContext = Depends(require_user)) -> Workspace:
    rows = (
        user_client(ctx.jwt)
        .table("workspaces")
        .select("id, name, owner_id, created_at, updated_at")
        .eq("id", str(workspace_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        raise NotFound("workspace")
    return Workspace.model_validate(rows[0])
