"""Leads CRUD + activities + tasks.

The detail page needs lead + activities + tasks + linked-notes in one shot,
so we expose `/v1/leads/{id}/detail` as a composite endpoint to avoid the
frontend having to do four round-trips. Everything else stays thin CRUD.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict, Field

from api._core import lexorank
from api._core.audit import record as audit_record
from api._core.auth import UserContext, require_user
from api._core.errors import NotFound, VersionConflict
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["leads"])


LeadStage = Literal["new", "contacted", "qualified", "proposal", "won", "lost"]
LeadActivityKind = Literal["note", "call", "email", "stage", "file", "meeting"]


class Lead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    name: str
    role: str | None = None
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    source: str | None = None
    stage: LeadStage
    value_cents: int = 0
    owner_id: UUID | None = None
    tags: list[str] = Field(default_factory=list)
    avatar_color: str = "#3D49F5"
    avatar_initials: str | None = None
    linkedin_url: str | None = None
    last_touched_at: datetime | None = None
    next_step: str | None = None
    rank: str
    created_at: datetime
    updated_at: datetime


class LeadActivity(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    lead_id: UUID
    actor_id: UUID | None = None
    kind: LeadActivityKind
    headline: str
    detail: str | None = None
    attrs: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class LeadTask(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    lead_id: UUID
    title: str
    due_at: datetime | None = None
    done: bool = False
    done_at: datetime | None = None
    rank: str
    created_at: datetime
    updated_at: datetime


class LeadDetail(BaseModel):
    lead: Lead
    activities: list[LeadActivity]
    tasks: list[LeadTask]


class CreateLead(BaseModel):
    id: UUID | None = None
    name: str = Field(min_length=1, max_length=200)
    role: str | None = None
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    source: str | None = None
    stage: LeadStage = "new"
    value_cents: int = 0
    tags: list[str] = Field(default_factory=list)
    avatar_color: str = "#3D49F5"
    avatar_initials: str | None = None
    next_step: str | None = None
    first_note: str | None = None


class UpdateLead(BaseModel):
    name: str | None = None
    role: str | None = None
    company: str | None = None
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    source: str | None = None
    stage: LeadStage | None = None
    value_cents: int | None = None
    tags: list[str] | None = None
    avatar_color: str | None = None
    avatar_initials: str | None = None
    next_step: str | None = None


class CreateActivity(BaseModel):
    kind: LeadActivityKind
    headline: str = Field(min_length=1, max_length=240)
    detail: str | None = None


class CreateTask(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    due_at: datetime | None = None


class UpdateTask(BaseModel):
    title: str | None = None
    due_at: datetime | None = None
    done: bool | None = None


def _deterministic_initials(name: str) -> str:
    parts = [p for p in name.split() if p]
    if not parts:
        return "?"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


@router.get("/workspaces/{workspace_id}/leads", response_model=list[Lead])
def list_leads(
    workspace_id: UUID,
    stage: LeadStage | None = Query(default=None),
    ctx: UserContext = Depends(require_user),
) -> list[Lead]:
    client = user_client(ctx.jwt)
    q = (
        client.table("leads")
        .select("*")
        .eq("workspace_id", str(workspace_id))
        .is_("deleted_at", "null")
    )
    if stage:
        q = q.eq("stage", stage)
    rows = q.order("rank").execute().data or []
    return [Lead.model_validate(r) for r in rows]


@router.get("/leads/{lead_id}", response_model=Lead)
def get_lead(lead_id: UUID, ctx: UserContext = Depends(require_user)) -> Lead:
    rows = (
        user_client(ctx.jwt)
        .table("leads")
        .select("*")
        .eq("id", str(lead_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        raise NotFound("lead")
    return Lead.model_validate(rows[0])


@router.get("/leads/{lead_id}/detail", response_model=LeadDetail)
def get_lead_detail(lead_id: UUID, ctx: UserContext = Depends(require_user)) -> LeadDetail:
    """One-shot bundle for the detail page / drawer."""
    client = user_client(ctx.jwt)
    lead_rows = (
        client.table("leads").select("*").eq("id", str(lead_id)).is_("deleted_at", "null").limit(1).execute()
    ).data or []
    if not lead_rows:
        raise NotFound("lead")
    act_rows = (
        client.table("lead_activities")
        .select("*")
        .eq("lead_id", str(lead_id))
        .order("created_at", desc=True)
        .limit(50)
        .execute()
    ).data or []
    task_rows = (
        client.table("lead_tasks")
        .select("*")
        .eq("lead_id", str(lead_id))
        .order("rank")
        .execute()
    ).data or []
    return LeadDetail(
        lead=Lead.model_validate(lead_rows[0]),
        activities=[LeadActivity.model_validate(r) for r in act_rows],
        tasks=[LeadTask.model_validate(r) for r in task_rows],
    )


@router.post(
    "/workspaces/{workspace_id}/leads",
    response_model=Lead,
    status_code=201,
)
def create_lead(
    workspace_id: UUID, body: CreateLead, ctx: UserContext = Depends(require_user)
) -> Lead:
    client = user_client(ctx.jwt)
    tail = (
        client.table("leads")
        .select("rank")
        .eq("workspace_id", str(workspace_id))
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    new_rank = lexorank.between(tail[0]["rank"] if tail else None, None)

    payload = {
        "id": str(body.id or uuid4()),
        "workspace_id": str(workspace_id),
        "name": body.name,
        "role": body.role,
        "company": body.company,
        "email": body.email,
        "phone": body.phone,
        "location": body.location,
        "source": body.source,
        "stage": body.stage,
        "value_cents": body.value_cents,
        "owner_id": ctx.user_id,
        "tags": body.tags,
        "avatar_color": body.avatar_color,
        "avatar_initials": body.avatar_initials or _deterministic_initials(body.name),
        "next_step": body.next_step,
        "rank": new_rank,
        "created_by": ctx.user_id,
    }
    inserted = client.table("leads").insert(payload).execute().data[0]

    # First note → create an activity
    if body.first_note:
        client.table("lead_activities").insert(
            {
                "workspace_id": str(workspace_id),
                "lead_id": inserted["id"],
                "actor_id": ctx.user_id,
                "kind": "note",
                "headline": "Note",
                "detail": body.first_note,
            }
        ).execute()

    return Lead.model_validate(inserted)


@router.patch("/leads/{lead_id}", response_model=Lead)
def update_lead(
    lead_id: UUID, body: UpdateLead, ctx: UserContext = Depends(require_user)
) -> Lead:
    client = user_client(ctx.jwt)
    updates = body.model_dump(exclude_none=True)
    if not updates:
        return get_lead(lead_id, ctx)

    before = (
        client.table("leads").select("stage, next_step").eq("id", str(lead_id)).limit(1).execute()
    ).data or []
    prior_stage = before[0]["stage"] if before else None

    rows = (
        client.table("leads")
        .update(updates)
        .eq("id", str(lead_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("lead")

    # Stage change → write a stage activity for the timeline
    if "stage" in updates and prior_stage and updates["stage"] != prior_stage:
        client.table("lead_activities").insert(
            {
                "workspace_id": rows[0]["workspace_id"],
                "lead_id": str(lead_id),
                "actor_id": ctx.user_id,
                "kind": "stage",
                "headline": f"Moved to {updates['stage']}",
                "detail": None,
            }
        ).execute()

    return Lead.model_validate(rows[0])


@router.post("/leads/{lead_id}/rank", response_model=Lead)
def rank_lead(
    lead_id: UUID,
    body: dict[str, Any],
    ctx: UserContext = Depends(require_user),
) -> Lead:
    new_rank = lexorank.between(body.get("before"), body.get("after"))
    updates: dict[str, Any] = {"rank": new_rank}
    if "stage" in body and body["stage"]:
        updates["stage"] = body["stage"]
    rows = (
        user_client(ctx.jwt)
        .table("leads")
        .update(updates)
        .eq("id", str(lead_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("lead")
    return Lead.model_validate(rows[0])


@router.delete("/leads/{lead_id}", status_code=204)
def delete_lead(lead_id: UUID, ctx: UserContext = Depends(require_user)) -> None:
    from datetime import timezone

    client = user_client(ctx.jwt)
    rows = (
        client.table("leads")
        .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", str(lead_id))
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    if not rows:
        raise NotFound("lead")
    audit_record(
        workspace_id=rows[0]["workspace_id"],
        actor_id=ctx.user_id,
        action="lead.delete",
        entity_kind="lead",
        entity_id=str(lead_id),
        before=rows[0],
    )


# --- activities ----------------------------------------------------------
@router.post("/leads/{lead_id}/activities", response_model=LeadActivity, status_code=201)
def add_activity(
    lead_id: UUID, body: CreateActivity, ctx: UserContext = Depends(require_user)
) -> LeadActivity:
    client = user_client(ctx.jwt)
    lead = (
        client.table("leads").select("workspace_id").eq("id", str(lead_id)).limit(1).execute()
    ).data or []
    if not lead:
        raise NotFound("lead")
    inserted = (
        client.table("lead_activities")
        .insert(
            {
                "workspace_id": lead[0]["workspace_id"],
                "lead_id": str(lead_id),
                "actor_id": ctx.user_id,
                "kind": body.kind,
                "headline": body.headline,
                "detail": body.detail,
            }
        )
        .execute()
        .data[0]
    )
    client.table("leads").update({"last_touched_at": inserted["created_at"]}).eq(
        "id", str(lead_id)
    ).execute()
    return LeadActivity.model_validate(inserted)


# --- tasks ---------------------------------------------------------------
@router.post("/leads/{lead_id}/tasks", response_model=LeadTask, status_code=201)
def add_task(
    lead_id: UUID, body: CreateTask, ctx: UserContext = Depends(require_user)
) -> LeadTask:
    client = user_client(ctx.jwt)
    lead = (
        client.table("leads").select("workspace_id").eq("id", str(lead_id)).limit(1).execute()
    ).data or []
    if not lead:
        raise NotFound("lead")
    tail = (
        client.table("lead_tasks")
        .select("rank")
        .eq("lead_id", str(lead_id))
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    new_rank = lexorank.between(tail[0]["rank"] if tail else None, None)
    inserted = (
        client.table("lead_tasks")
        .insert(
            {
                "workspace_id": lead[0]["workspace_id"],
                "lead_id": str(lead_id),
                "title": body.title,
                "due_at": body.due_at.isoformat() if body.due_at else None,
                "rank": new_rank,
            }
        )
        .execute()
        .data[0]
    )
    return LeadTask.model_validate(inserted)


@router.patch("/lead-tasks/{task_id}", response_model=LeadTask)
def update_task(
    task_id: UUID, body: UpdateTask, ctx: UserContext = Depends(require_user)
) -> LeadTask:
    from datetime import timezone

    updates = body.model_dump(exclude_none=True)
    if "done" in updates:
        updates["done_at"] = datetime.now(timezone.utc).isoformat() if updates["done"] else None
    if body.due_at is not None:
        updates["due_at"] = body.due_at.isoformat()
    rows = (
        user_client(ctx.jwt)
        .table("lead_tasks")
        .update(updates)
        .eq("id", str(task_id))
        .execute()
    ).data or []
    if not rows:
        raise NotFound("task")
    return LeadTask.model_validate(rows[0])
