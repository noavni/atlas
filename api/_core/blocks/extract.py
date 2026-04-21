"""Extract flat ``blocks`` rows from a ProseMirror/Tiptap JSON doc.

The doc has shape ``{"type": "doc", "content": [ ...top-level nodes ]}``.
Each top-level node becomes one row; nested nodes (list items, quote
children) become rows too and carry ``parent_block_id`` + ``depth``.

Block ``id`` is read from ``node.attrs.id`` when present (Tiptap extension
should assign UUIDs on creation). If absent, we generate one — the caller
is responsible for writing it back into the doc so IDs are stable across
saves.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any

from api._core import lexorank


@dataclass
class ExtractedBlock:
    id: str
    page_id: str
    workspace_id: str
    type: str
    text: str
    parent_block_id: str | None
    rank: str
    depth: int
    attrs: dict[str, Any] = field(default_factory=dict)


def _collect_text(node: dict[str, Any]) -> str:
    """Concatenate the plaintext content under a node (recursive)."""
    if node.get("type") == "text":
        return str(node.get("text") or "")
    parts: list[str] = []
    for child in node.get("content") or []:
        parts.append(_collect_text(child))
    return "".join(parts)


def extract(
    *,
    doc: dict[str, Any],
    page_id: str,
    workspace_id: str,
) -> list[ExtractedBlock]:
    """Walk ``doc`` and return flat rows in sibling order.

    Emits rows only for block-level nodes we persist for search/backlinks —
    inline text marks (bold, italic, links, mentions) stay inside the
    parent's ``text`` field.
    """
    persistable = {
        "paragraph",
        "heading",
        "bulletList",
        "orderedList",
        "listItem",
        "taskList",
        "taskItem",
        "blockquote",
        "codeBlock",
        "horizontalRule",
        "image",
        "callout",
    }

    rows: list[ExtractedBlock] = []

    def walk(
        node: dict[str, Any],
        parent_id: str | None,
        depth: int,
        sibling_left: str | None,
    ) -> str | None:
        node_type = node.get("type")
        if node_type is None or node_type == "doc":
            # Recurse through children at depth 0
            left = sibling_left
            for child in node.get("content") or []:
                left = walk(child, None, depth, left)
            return left

        if node_type not in persistable:
            # Skip unknown / non-persistable block types but recurse in case
            # they contain persistable children (defensive).
            left = sibling_left
            for child in node.get("content") or []:
                left = walk(child, parent_id, depth, left)
            return left

        attrs = dict(node.get("attrs") or {})
        block_id = attrs.pop("id", None) or str(uuid.uuid4())
        rank = lexorank.between(sibling_left, None)

        rows.append(
            ExtractedBlock(
                id=block_id,
                page_id=page_id,
                workspace_id=workspace_id,
                type=node_type,
                text=_collect_text(node),
                parent_block_id=parent_id,
                rank=rank,
                depth=depth,
                attrs=attrs,
            )
        )

        # Recurse into children
        child_left: str | None = None
        for child in node.get("content") or []:
            child_left = walk(child, block_id, depth + 1, child_left)
        return rank

    walk(doc, None, 0, None)
    return rows


def diff(
    *,
    existing: list[dict[str, Any]],
    extracted: list[ExtractedBlock],
) -> tuple[list[ExtractedBlock], list[ExtractedBlock], list[str]]:
    """Compute upsert/insert/delete sets for a page's block rows.

    Returns ``(to_insert, to_update, to_delete_ids)``. Identity is by block id.
    """
    have = {r["id"]: r for r in existing}
    incoming = {b.id: b for b in extracted}

    inserts: list[ExtractedBlock] = []
    updates: list[ExtractedBlock] = []
    for bid, block in incoming.items():
        if bid in have:
            prior = have[bid]
            if (
                prior.get("type") != block.type
                or prior.get("text") != block.text
                or prior.get("parent_block_id") != block.parent_block_id
                or prior.get("rank") != block.rank
                or prior.get("depth") != block.depth
                or prior.get("attrs") != block.attrs
            ):
                updates.append(block)
        else:
            inserts.append(block)

    deletes = [bid for bid in have if bid not in incoming]
    return inserts, updates, deletes
