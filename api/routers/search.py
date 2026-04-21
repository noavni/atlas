"""Hybrid search: FTS via pg_trgm + (optional) vector top-k.

The vector branch activates only when VOYAGE_API_KEY is configured. FTS
alone is always available and covers the 80% case; adding vector improves
semantic matches on topical synonyms.

Result shape is uniform across kinds (card / page / inbox) so the frontend
can render a single list.
"""

from __future__ import annotations

from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from api._core.auth import UserContext, require_user
from api._core.providers.embedding import get_embedding_provider
from api._core.settings import get_settings
from api._core.supabase import user_client

router = APIRouter(prefix="/v1/search", tags=["search"])


class SearchHit(BaseModel):
    kind: Literal["card", "page", "inbox"]
    id: UUID
    title: str
    snippet: str
    score: float


@router.get("", response_model=list[SearchHit])
async def search(
    q: str = Query(min_length=1, max_length=400),
    workspace_id: UUID = Query(...),
    limit: int = Query(default=20, le=50),
    ctx: UserContext = Depends(require_user),
) -> list[SearchHit]:
    client = user_client(ctx.jwt)
    ws = str(workspace_id)

    hits: list[SearchHit] = []

    # --- FTS over card titles + descriptions ---------------------------
    cards = (
        client.table("cards")
        .select("id, title, description")
        .eq("workspace_id", ws)
        .is_("deleted_at", "null")
        .or_(f"title.ilike.%{q}%,description.ilike.%{q}%")
        .limit(limit)
        .execute()
    ).data or []
    for c in cards:
        hits.append(
            SearchHit(
                kind="card",
                id=c["id"],
                title=c["title"],
                snippet=(c.get("description") or "")[:200],
                score=0.6,
            )
        )

    # --- FTS over page titles + block text -----------------------------
    pages = (
        client.table("pages")
        .select("id, title")
        .eq("workspace_id", ws)
        .is_("deleted_at", "null")
        .ilike("title", f"%{q}%")
        .limit(limit)
        .execute()
    ).data or []
    for p in pages:
        hits.append(
            SearchHit(kind="page", id=p["id"], title=p["title"], snippet="", score=0.7)
        )

    blocks = (
        client.table("blocks")
        .select("id, page_id, text, pages!page_id(title)")
        .eq("workspace_id", ws)
        .ilike("text", f"%{q}%")
        .limit(limit)
        .execute()
    ).data or []
    for b in blocks:
        page = b.get("pages") or {}
        hits.append(
            SearchHit(
                kind="page",
                id=b["page_id"],
                title=page.get("title") or "",
                snippet=(b.get("text") or "")[:200],
                score=0.55,
            )
        )

    # --- FTS over inbox (user-scoped already via RLS) ------------------
    inbox = (
        client.table("inbox_items")
        .select("id, raw_text, transcript")
        .eq("workspace_id", ws)
        .is_("deleted_at", "null")
        .or_(f"raw_text.ilike.%{q}%,transcript.ilike.%{q}%")
        .limit(limit)
        .execute()
    ).data or []
    for i in inbox:
        title = (i.get("raw_text") or i.get("transcript") or "Capture").strip()[:80]
        hits.append(
            SearchHit(
                kind="inbox",
                id=i["id"],
                title=title,
                snippet=(i.get("transcript") or i.get("raw_text") or "")[:200],
                score=0.5,
            )
        )

    # --- Vector branch (only if Voyage configured) ---------------------
    settings = get_settings()
    if settings.voyage_api_key:
        try:
            provider = get_embedding_provider()
            res = await provider.embed([q])
            if res.vectors:
                vec = res.vectors[0]
                # Supabase Postgres RPC preferred for vector search; the
                # REST API also accepts `rpc` calls, so we delegate to a
                # server-side function to avoid shipping the full embedding
                # through the JSON URL. The ``atlas_semantic_search`` RPC
                # is defined in migration 0500 (Phase 4 add).
                rpc = client.rpc(
                    "atlas_semantic_search",
                    {"query_embedding": vec, "ws_id": ws, "match_count": limit},
                ).execute()
                for row in rpc.data or []:
                    hits.append(
                        SearchHit(
                            kind=row.get("source_kind", "page"),
                            id=row["source_id"],
                            title=row.get("title") or "",
                            snippet=(row.get("chunk_text") or "")[:200],
                            score=float(row.get("similarity", 0.0)),
                        )
                    )
        except Exception:
            # Vector branch is best-effort; FTS results already populated.
            pass

    # Deduplicate by (kind, id); keep highest score.
    best: dict[tuple[str, str], SearchHit] = {}
    for h in hits:
        key = (h.kind, str(h.id))
        if key not in best or h.score > best[key].score:
            best[key] = h
    return sorted(best.values(), key=lambda h: h.score, reverse=True)[:limit]
