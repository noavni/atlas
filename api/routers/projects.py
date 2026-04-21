from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, Depends

from api._core import lexorank
from api._core.auth import UserContext, require_user
from api._core.audit import record as audit_record
from api._core.errors import NotFound
from api._core.models import CreateProject, Project, UpdateProject
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["projects"])


@router.get("/workspaces/{workspace_id}/projects", response_model=list[Project])
def list_projects(workspace_id: UUID, ctx: UserContext = Depends(require_user)) -> list[Project]:
    rows = (
        user_client(ctx.jwt)
        .table("projects")
        .select("*")
        .eq("workspace_id", str(workspace_id))
        .is_("deleted_at", "null")
        .order("rank")
        .execute()
    ).data or []
    return [Project.model_validate(r) for r in rows]


@router.post(
    "/workspaces/{workspace_id}/projects",
    response_model=Project,
    status_code=201,
)
def create_project(
    workspace_id: UUID,
    body: CreateProject,
    ctx: UserContext = Depends(require_user),
) -> Project:
    client = user_client(ctx.jwt)
    tail = (
        client.table("projects")
        .select("rank")
        .eq("workspace_id", str(workspace_id))
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    rank = lexorank.between(tail[0]["rank"] if tail else None, None)
    payload = {
        "id": str(body.id or uuid4()),
        "workspace_id": str(workspace_id),
        "name": body.name,
        "description": body.description,
        "rank": rank,
        "created_by": ctx.user_id,
    }
    inserted = client.table("projects").insert(payload).execute().data[0]

    # Auto-create a default board + the standard 5 columns so the project
    # has a working board on first open (no "empty state" dead-end).
    board_id = str(uuid4())
    client.table("boards").insert(
        {
            "id": board_id,
            "project_id": inserted["id"],
            "workspace_id": str(workspace_id),
            "name": "Main",
            "created_by": ctx.user_id,
        }
    ).execute()

    default_cols = [
        ("Backlog", "backlog"),
        ("To do", "todo"),
        ("In progress", "in_progress"),
        ("In review", "in_review"),
        ("Done", "done"),
    ]
    col_rank_prev: str | None = None
    col_rows = []
    for name, state in default_cols:
        col_rank_prev = lexorank.between(col_rank_prev, None)
        col_rows.append(
            {
                "id": str(uuid4()),
                "board_id": board_id,
                "workspace_id": str(workspace_id),
                "name": name,
                "rank": col_rank_prev,
                "default_workflow_state": state,
                "created_by": ctx.user_id,
            }
        )
    client.table("columns").insert(col_rows).execute()

    return Project.model_validate(inserted)


@router.patch("/projects/{project_id}", response_model=Project)
def update_project(
    project_id: UUID,
    body: UpdateProject,
    ctx: UserContext = Depends(require_user),
) -> Project:
    updates = body.model_dump(exclude_none=True)
    if not updates:
        rows = (
            user_client(ctx.jwt).table("projects").select("*").eq("id", str(project_id)).limit(1).execute()
        ).data or []
        if not rows:
            raise NotFound("project")
        return Project.model_validate(rows[0])
    rows = (
        user_client(ctx.jwt)
        .table("projects")
        .update(updates)
        .eq("id", str(project_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("project")
    return Project.model_validate(rows[0])


@router.delete("/projects/{project_id}", status_code=204)
def delete_project(project_id: UUID, ctx: UserContext = Depends(require_user)) -> None:
    from datetime import datetime, timezone

    client = user_client(ctx.jwt)
    rows = (
        client.table("projects")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(project_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("project")
    audit_record(
        workspace_id=rows[0]["workspace_id"],
        actor_id=ctx.user_id,
        action="project.delete",
        entity_kind="project",
        entity_id=str(project_id),
        before=rows[0],
    )
