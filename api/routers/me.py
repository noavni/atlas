from __future__ import annotations

from fastapi import APIRouter, Depends

from api._core.auth import UserContext, require_user
from api._core.models import MeResponse, Workspace
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["me"])


@router.get("/me", response_model=MeResponse)
def me(ctx: UserContext = Depends(require_user)) -> MeResponse:
    client = user_client(ctx.jwt)
    rows = (
        client.table("workspaces")
        .select("id, name, owner_id, created_at, updated_at")
        .is_("deleted_at", "null")
        .order("created_at")
        .execute()
    ).data or []
    return MeResponse(
        user_id=ctx.user_id,  # type: ignore[arg-type]
        email=ctx.email,
        workspaces=[Workspace.model_validate(r) for r in rows],
    )
