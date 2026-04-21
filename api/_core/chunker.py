"""Chunk blocks into embedding-sized windows.

Per-block is the default granularity so retrieval points back to a specific
block. Very short blocks (<80 tokens) are merged forward until we hit the
target window (~250 tokens) — this avoids embedding a bunch of 4-word
paragraphs individually.

Token estimation is character-based (÷ 4) which is close enough for Latin +
Hebrew mixed text at the budget we care about.
"""

from __future__ import annotations

from dataclasses import dataclass

SHORT_TOKENS = 80
TARGET_TOKENS = 250
MAX_TOKENS = 400


@dataclass(frozen=True)
class Chunk:
    source_ids: list[str]
    text: str


def _est_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def chunk_blocks(blocks: list[dict[str, object]], *, page_title: str) -> list[Chunk]:
    """Merge adjacent blocks into ~TARGET_TOKENS windows.

    Each chunk's text is prefixed with the page title + nearest heading for
    retrieval context — a chunker staple that meaningfully improves top-k.
    """
    out: list[Chunk] = []
    buf_ids: list[str] = []
    buf_text: list[str] = []
    buf_tokens = 0
    heading_prefix = ""

    for block in blocks:
        btype = block.get("type")
        text = str(block.get("text") or "").strip()
        bid = str(block.get("id"))
        if not text:
            continue

        if btype == "heading":
            heading_prefix = text
            # Headings get their own chunk so they rank for title queries.
            out.append(Chunk(source_ids=[bid], text=f"{page_title} — {text}"))
            # Reset accumulator
            buf_ids, buf_text, buf_tokens = [], [], 0
            continue

        t = _est_tokens(text)
        # If adding would blow the max, flush first
        if buf_tokens + t > MAX_TOKENS and buf_ids:
            out.append(_flush(buf_ids, buf_text, page_title, heading_prefix))
            buf_ids, buf_text, buf_tokens = [], [], 0

        buf_ids.append(bid)
        buf_text.append(text)
        buf_tokens += t

        if buf_tokens >= TARGET_TOKENS:
            out.append(_flush(buf_ids, buf_text, page_title, heading_prefix))
            buf_ids, buf_text, buf_tokens = [], [], 0

    # Tail: flush whatever remains, even if it's short
    if buf_ids and (buf_tokens >= SHORT_TOKENS or not out):
        out.append(_flush(buf_ids, buf_text, page_title, heading_prefix))
    elif buf_ids and out:
        # Very short tail: merge into previous chunk
        last = out[-1]
        out[-1] = Chunk(
            source_ids=last.source_ids + buf_ids,
            text=f"{last.text}\n\n{' '.join(buf_text)}",
        )

    return out


def _flush(
    ids: list[str], texts: list[str], title: str, heading: str
) -> Chunk:
    prefix = title if not heading else f"{title} — {heading}"
    return Chunk(source_ids=list(ids), text=f"{prefix}\n\n{' '.join(texts)}")
