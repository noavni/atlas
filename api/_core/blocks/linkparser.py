"""Parse ``[[Title]]`` wikilinks out of block text.

Matches the Obsidian-flavoured dialect: ``[[Target]]`` and
``[[Target|alias text]]``. Nested brackets are not supported; link text
cannot contain ``]]`` or newlines.

Returns a list of link tuples to upsert against the ``links`` table.
Unresolved links (target title not in the workspace) are stored with
``target_page_id = None`` and a lowercase index on link_text makes
later re-resolution cheap.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

LINK_RE = re.compile(r"\[\[([^\[\]\n|]{1,200})(?:\|([^\[\]\n]{1,200}))?\]\]")


@dataclass(frozen=True)
class ParsedLink:
    link_text: str
    display_text: str


def parse_links(text: str) -> list[ParsedLink]:
    if not text:
        return []
    out: list[ParsedLink] = []
    for m in LINK_RE.finditer(text):
        target = m.group(1).strip()
        alias = (m.group(2) or "").strip()
        if not target:
            continue
        out.append(ParsedLink(link_text=target, display_text=alias or target))
    return out
