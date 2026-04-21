"""Embedding job: given an `inbox` or `page` source, (re)embed its chunks.

Queue message shape:
    {"kind": "page" | "inbox", "id": "<uuid>"}

For pages, we chunk blocks with page-title prefix and embed each chunk.
For inbox items, we embed the raw text (or transcript when present) as a
single chunk. Existing embedding rows for the same (source_kind, source_id)
are deleted before re-embedding so edits replace cleanly.
"""

from __future__ import annotations

import asyncio
from typing import Any

from api._core.chunker import chunk_blocks
from api._core.providers.embedding import get_embedding_provider
from api._core.supabase import service_client


async def handle(payload: dict[str, Any]) -> None:
    kind = payload.get("kind")
    source_id = payload.get("id")
    if not isinstance(source_id, str):
        return
    if kind == "page":
        await _embed_page(source_id)
    elif kind == "inbox":
        await _embed_inbox(source_id)


def handle_sync(payload: dict[str, Any]) -> None:
    """Sync wrapper for the worker drain (which runs outside an event loop)."""
    asyncio.run(handle(payload))


async def _embed_page(page_id: str) -> None:
    client = service_client()
    page = (
        client.table("pages")
        .select("id, workspace_id, title")
        .eq("id", page_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not page:
        return
    ws_id = page[0]["workspace_id"]
    title = page[0]["title"]

    blocks = (
        client.table("blocks")
        .select("id, type, text, rank")
        .eq("page_id", page_id)
        .order("rank")
        .execute()
    ).data or []
    if not blocks:
        return

    chunks = chunk_blocks([dict(b) for b in blocks], page_title=title)
    if not chunks:
        return

    provider = get_embedding_provider()
    result = await provider.embed([c.text for c in chunks])
    if not result.vectors:
        return

    # Replace existing embeddings for this page
    client.table("embeddings").delete().eq("source_kind", "block").eq("page_id", page_id).execute()

    rows = [
        {
            "workspace_id": ws_id,
            "source_kind": "block",
            # Embedding points at the first source block so click-through
            # lands in the right spot; additional ids captured in text prefix.
            "source_id": chunk.source_ids[0],
            "page_id": page_id,
            "chunk_text": chunk.text,
            "token_count": len(chunk.text) // 4,
            "embedding": vec,
            "model_version": result.model,
        }
        for chunk, vec in zip(chunks, result.vectors, strict=True)
    ]
    client.table("embeddings").insert(rows).execute()


async def _embed_inbox(inbox_id: str) -> None:
    client = service_client()
    item = (
        client.table("inbox_items")
        .select("id, workspace_id, raw_text, transcript")
        .eq("id", inbox_id)
        .is_("deleted_at", "null")
        .limit(1)
        .execute()
    ).data or []
    if not item:
        return
    text = (item[0].get("transcript") or item[0].get("raw_text") or "").strip()
    if not text:
        return

    provider = get_embedding_provider()
    result = await provider.embed([text])
    if not result.vectors:
        return

    client.table("embeddings").delete().eq("source_kind", "inbox").eq("source_id", inbox_id).execute()
    client.table("embeddings").insert(
        {
            "workspace_id": item[0]["workspace_id"],
            "source_kind": "inbox",
            "source_id": inbox_id,
            "chunk_text": text,
            "token_count": len(text) // 4,
            "embedding": result.vectors[0],
            "model_version": result.model,
        }
    ).execute()
