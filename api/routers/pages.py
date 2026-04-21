from __future__ import annotations

from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime

from api._core import lexorank
from api._core.auth import UserContext, require_user
from api._core.blocks.extract import ExtractedBlock, diff, extract
from api._core.blocks.linkparser import parse_links
from api._core.errors import NotFound, VersionConflict
from api._core.supabase import user_client

router = APIRouter(prefix="/v1", tags=["pages"])


class PageSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    workspace_id: UUID
    title: str
    parent_page_id: UUID | None = None
    rank: str
    version: int
    created_at: datetime
    updated_at: datetime


class Page(PageSummary):
    content: dict[str, Any] = Field(default_factory=dict)


class CreatePage(BaseModel):
    id: UUID | None = None
    title: str = Field(min_length=1, max_length=400)
    parent_page_id: UUID | None = None
    content: dict[str, Any] | None = None


class UpdatePage(BaseModel):
    version: int
    title: str | None = Field(default=None, min_length=1, max_length=400)
    content: dict[str, Any] | None = None


class BacklinkRow(BaseModel):
    source_page_id: UUID
    source_title: str
    source_block_id: UUID
    link_text: str


# --------------------------------------------------------------------------
@router.get("/workspaces/{workspace_id}/pages", response_model=list[PageSummary])
def list_pages(workspace_id: UUID, ctx: UserContext = Depends(require_user)) -> list[PageSummary]:
    rows = (
        user_client(ctx.jwt)
        .table("pages")
        .select("id, workspace_id, title, parent_page_id, rank, version, created_at, updated_at")
        .eq("workspace_id", str(workspace_id))
        .is_("deleted_at", "null")
        .order("rank")
        .execute()
    ).data or []
    return [PageSummary.model_validate(r) for r in rows]


@router.get("/pages/{page_id}", response_model=Page)
def get_page(page_id: UUID, ctx: UserContext = Depends(require_user)) -> Page:
    rows = (
        user_client(ctx.jwt)
        .table("pages")
        .select("*")
        .eq("id", str(page_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not rows:
        raise NotFound("page")
    return Page.model_validate(rows[0])


@router.post("/workspaces/{workspace_id}/pages", response_model=Page, status_code=201)
def create_page(
    workspace_id: UUID, body: CreatePage, ctx: UserContext = Depends(require_user)
) -> Page:
    client = user_client(ctx.jwt)
    # Rank: append
    tail = (
        client.table("pages")
        .select("rank")
        .eq("workspace_id", str(workspace_id))
        .is_("deleted_at", "null")
        .order("rank", desc=True)
        .limit(1)
        .execute()
    ).data or []
    rank = lexorank.between(tail[0]["rank"] if tail else None, None)

    page_id = body.id or uuid4()
    payload = {
        "id": str(page_id),
        "workspace_id": str(workspace_id),
        "title": body.title,
        "parent_page_id": str(body.parent_page_id) if body.parent_page_id else None,
        "content": body.content or {"type": "doc", "content": []},
        "rank": rank,
        "created_by": ctx.user_id,
    }
    inserted = client.table("pages").insert(payload).execute().data[0]

    # Re-resolve unresolved links whose link_text matches this new title.
    _resolve_incoming_links(client, workspace_id=str(workspace_id), new_title=body.title, new_page_id=str(page_id))

    # Extract blocks + parse links from initial content
    _sync_blocks_and_links(
        client, page_id=str(page_id), workspace_id=str(workspace_id), doc=payload["content"]
    )
    return Page.model_validate(inserted)


@router.patch("/pages/{page_id}", response_model=Page)
def update_page(
    page_id: UUID, body: UpdatePage, ctx: UserContext = Depends(require_user)
) -> Page:
    client = user_client(ctx.jwt)
    current = (
        client.table("pages")
        .select("*")
        .eq("id", str(page_id))
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not current:
        raise NotFound("page")
    row = current[0]
    if row["version"] != body.version:
        raise VersionConflict(current=row)

    old_title = row["title"]
    updates: dict[str, Any] = {"version": row["version"] + 1}
    if body.title is not None:
        updates["title"] = body.title
    if body.content is not None:
        updates["content"] = body.content

    rows = (
        client.table("pages")
        .update(updates)
        .eq("id", str(page_id))
        .eq("version", body.version)
        .execute()
    ).data or []
    if not rows:
        latest = (client.table("pages").select("*").eq("id", str(page_id)).limit(1).execute()).data or []
        raise VersionConflict(current=latest[0] if latest else None)

    new_row = rows[0]
    # If content changed, diff blocks + rebuild links for this page
    if body.content is not None:
        _sync_blocks_and_links(
            client,
            page_id=str(page_id),
            workspace_id=new_row["workspace_id"],
            doc=body.content,
        )
    # If title changed, incoming links were already correct (FK on page id);
    # we only need to re-resolve any *unresolved* links whose text matches
    # the new title.
    if body.title is not None and body.title != old_title:
        _resolve_incoming_links(
            client,
            workspace_id=new_row["workspace_id"],
            new_title=body.title,
            new_page_id=str(page_id),
        )
    return Page.model_validate(new_row)


@router.get("/pages/{page_id}/backlinks", response_model=list[BacklinkRow])
def backlinks(page_id: UUID, ctx: UserContext = Depends(require_user)) -> list[BacklinkRow]:
    client = user_client(ctx.jwt)
    # Join links → pages to get the source page title
    rows = (
        client.table("links")
        .select("source_page_id, source_block_id, link_text, pages!source_page_id(title)")
        .eq("target_page_id", str(page_id))
        .execute()
    ).data or []
    out: list[BacklinkRow] = []
    for r in rows:
        src = r.get("pages") or {}
        out.append(
            BacklinkRow(
                source_page_id=r["source_page_id"],
                source_title=src.get("title") or "",
                source_block_id=r["source_block_id"],
                link_text=r["link_text"],
            )
        )
    return out


@router.get("/workspaces/{workspace_id}/unresolved-links")
def unresolved_links(
    workspace_id: UUID, ctx: UserContext = Depends(require_user)
) -> list[dict[str, Any]]:
    rows = (
        user_client(ctx.jwt)
        .table("links")
        .select("id, source_page_id, source_block_id, link_text")
        .eq("workspace_id", str(workspace_id))
        .is_("target_page_id", "null")
        .execute()
    ).data or []
    return rows


# --------------------------------------------------------------------------
def _sync_blocks_and_links(
    client: Any, *, page_id: str, workspace_id: str, doc: dict[str, Any]
) -> None:
    # 1. Extract blocks from the new doc
    extracted = extract(doc=doc, page_id=page_id, workspace_id=workspace_id)

    # 2. Load existing blocks for diff
    existing = (
        client.table("blocks")
        .select("id, type, text, parent_block_id, rank, depth, attrs")
        .eq("page_id", page_id)
        .execute()
    ).data or []
    inserts, updates, deletes = diff(existing=existing, extracted=extracted)

    if deletes:
        client.table("blocks").delete().in_("id", deletes).execute()
    for block in inserts + updates:
        _upsert_block(client, block)

    # 3. Rebuild links for this page (delete + recreate; simple + correct)
    client.table("links").delete().eq("source_page_id", page_id).execute()

    # Build a case-insensitive title index
    title_rows = (
        client.table("pages")
        .select("id, title")
        .eq("workspace_id", workspace_id)
        .is_("deleted_at", "null")
        .execute()
    ).data or []
    title_index = {r["title"].lower(): r["id"] for r in title_rows}

    link_rows: list[dict[str, Any]] = []
    for block in extracted:
        for parsed in parse_links(block.text):
            target_id = title_index.get(parsed.link_text.lower())
            link_rows.append(
                {
                    "workspace_id": workspace_id,
                    "source_block_id": block.id,
                    "source_page_id": page_id,
                    "target_page_id": target_id,
                    "link_text": parsed.link_text,
                    "resolved_at": None if target_id is None else "now()",
                }
            )
    if link_rows:
        client.table("links").insert(link_rows).execute()


def _upsert_block(client: Any, block: ExtractedBlock) -> None:
    client.table("blocks").upsert(
        {
            "id": block.id,
            "page_id": block.page_id,
            "workspace_id": block.workspace_id,
            "type": block.type,
            "text": block.text,
            "parent_block_id": block.parent_block_id,
            "rank": block.rank,
            "depth": block.depth,
            "attrs": block.attrs,
        },
        on_conflict="id",
    ).execute()


def _resolve_incoming_links(
    client: Any, *, workspace_id: str, new_title: str, new_page_id: str
) -> None:
    client.table("links").update(
        {"target_page_id": new_page_id, "resolved_at": "now()"}
    ).eq("workspace_id", workspace_id).is_("target_page_id", "null").ilike(
        "link_text", new_title
    ).execute()
