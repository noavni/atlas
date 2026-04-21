"""Fractional (LexoRank-style) ordering.

We use an alphabet-based rank string. Each rank lives between the two
lexicographic neighbours it was asked to sit between, so inserts never
renumber their siblings. Rebalancing only happens when a gap runs out of
precision, which at two-user scale is effectively never.

The alphabet is 62 chars (digits + lower + upper); prefix is `0|` so we
can introduce `1|`, `2|`, ... buckets later without touching existing
ranks (LexoRank uses this trick to give ops a cheap global reset point).

The API mirrors the TypeScript version in `lib/lexorank.ts` — keep them
in sync.
"""

from __future__ import annotations

ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
BUCKET_PREFIX = "0|"
MIN_CHAR = ALPHABET[0]
MAX_CHAR = ALPHABET[-1]
MID_CHAR = ALPHABET[len(ALPHABET) // 2]


def _body(rank: str) -> str:
    return rank.split("|", 1)[1] if "|" in rank else rank


def _with_prefix(body: str) -> str:
    return f"{BUCKET_PREFIX}{body}"


def _index(c: str) -> int:
    i = ALPHABET.find(c)
    if i == -1:
        raise ValueError(f"invalid rank char {c!r}")
    return i


def _mid_between_chars(a: str, b: str) -> str:
    """Return the alphabet character exactly between a and b (round down)."""
    ai, bi = _index(a), _index(b)
    if ai > bi:
        raise ValueError(f"rank chars out of order: {a!r} > {b!r}")
    return ALPHABET[(ai + bi) // 2]


def between(before: str | None, after: str | None) -> str:
    """Return a rank string strictly between ``before`` and ``after``.

    Either (or both) may be None; None means "the edge".
    """
    lo = _body(before) if before else ""
    hi = _body(after) if after else ""

    if before is not None and after is not None and lo >= hi:
        raise ValueError(f"ranks out of order: {before!r} >= {after!r}")

    # Walk character by character until we find room for an insertion.
    out: list[str] = []
    i = 0
    while True:
        lo_c = lo[i] if i < len(lo) else MIN_CHAR
        hi_c = hi[i] if i < len(hi) else MAX_CHAR

        mid_c = _mid_between_chars(lo_c, hi_c)
        if mid_c != lo_c:
            out.append(mid_c)
            return _with_prefix("".join(out))
        # No room here: take the lo char and iterate deeper.
        out.append(lo_c)
        i += 1
        # Safety bound; 30 chars gives ~62^30 gap which is effectively infinite
        # for two users.
        if i > 64:
            raise RuntimeError("lexorank exhausted precision; rebalance needed")


def initial() -> str:
    """Rank to use when inserting the first item in an empty list."""
    return _with_prefix(MID_CHAR)
