"""AI-assisted inbox organization.

Given a set of raw inbox captures, asks Claude to propose, per item, whether
it should become a **note** or a **card** and suggest a target project or
parent note. Nothing is applied automatically — the endpoint returns
suggestions, the frontend shows them, and the user confirms each.

Phase 4 scope: text-only captures. Voice memos without transcripts are
skipped (Phase 5 wires STT and voice will flow through).
"""

from __future__ import annotations

import json
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from api._core.auth import UserContext, require_user
from api._core.settings import get_settings
from api._core.supabase import user_client

router = APIRouter(prefix="/v1/organize", tags=["organize"])


class Suggestion(BaseModel):
    inbox_item_id: UUID
    kind: Literal["note", "card", "skip"]
    target_project_id: UUID | None = None
    target_parent_page_id: UUID | None = None
    proposed_title: str
    rationale: str


class SuggestResponse(BaseModel):
    suggestions: list[Suggestion]


class SuggestRequest(BaseModel):
    workspace_id: UUID


@router.post("/suggest", response_model=SuggestResponse)
async def suggest(
    body: SuggestRequest, ctx: UserContext = Depends(require_user)
) -> SuggestResponse:
    settings = get_settings()
    if not settings.anthropic_api_key:
        return SuggestResponse(suggestions=[])

    client = user_client(ctx.jwt)
    ws = str(body.workspace_id)

    inbox_rows = (
        client.table("inbox_items")
        .select("id, kind, raw_text, transcript, captured_at")
        .eq("workspace_id", ws)
        .eq("user_id", ctx.user_id)
        .eq("status", "inbox")
        .is_("deleted_at", "null")
        .order("captured_at", desc=True)
        .limit(5)
        .execute()
    ).data or []

    projects = (
        client.table("projects")
        .select("id, name")
        .eq("workspace_id", ws)
        .is_("deleted_at", "null")
        .execute()
    ).data or []

    pages = (
        client.table("pages")
        .select("id, title")
        .eq("workspace_id", ws)
        .is_("deleted_at", "null")
        .order("updated_at", desc=True)
        .limit(30)
        .execute()
    ).data or []

    # Build a structured prompt for Claude
    items_context = [
        {
            "inbox_item_id": r["id"],
            "kind": r["kind"],
            "text": r.get("transcript") or r.get("raw_text") or "",
        }
        for r in inbox_rows
        if (r.get("transcript") or r.get("raw_text"))
    ]
    if not items_context:
        return SuggestResponse(suggestions=[])

    tool_schema = {
        "name": "propose_destinations",
        "description": "Propose a destination for each inbox item.",
        "input_schema": {
            "type": "object",
            "required": ["suggestions"],
            "properties": {
                "suggestions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": [
                            "inbox_item_id",
                            "kind",
                            "proposed_title",
                            "rationale",
                        ],
                        "properties": {
                            "inbox_item_id": {"type": "string", "format": "uuid"},
                            "kind": {"type": "string", "enum": ["note", "card", "skip"]},
                            "target_project_id": {"type": ["string", "null"]},
                            "target_parent_page_id": {"type": ["string", "null"]},
                            "proposed_title": {"type": "string", "maxLength": 200},
                            "rationale": {"type": "string", "maxLength": 400},
                        },
                    },
                }
            },
        },
    }

    from anthropic import AsyncAnthropic  # lazy import; keeps cold start lean

    anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)
    resp = await anthropic.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        tools=[tool_schema],
        tool_choice={"type": "tool", "name": "propose_destinations"},
        system=(
            "You help organize a personal knowledge workspace. Read each "
            "inbox item and suggest whether it becomes a note, a task card, "
            "or should be skipped. Prefer existing projects and parent notes "
            "when they match. Titles should be short and human, in the item's "
            "own language (Hebrew or English). If the item is a task or a "
            "reminder, choose 'card'. If it is an idea, observation, or "
            "reading, choose 'note'. Keep rationales to one short sentence."
        ),
        messages=[
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "inbox_items": items_context,
                        "existing_projects": projects,
                        "existing_pages": pages,
                    },
                    ensure_ascii=False,
                ),
            }
        ],
    )

    tool_use = next(
        (block for block in resp.content if block.type == "tool_use"), None
    )
    if not tool_use:
        return SuggestResponse(suggestions=[])

    raw: dict[str, Any] = tool_use.input  # type: ignore[assignment]
    return SuggestResponse(
        suggestions=[Suggestion(**s) for s in raw.get("suggestions", [])]
    )
