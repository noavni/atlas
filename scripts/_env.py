"""Tiny .env.local loader tolerant of Vercel-quoted values with embedded escapes."""
from __future__ import annotations

import json
import os
from pathlib import Path


def load(path: str | Path = ".env.local") -> dict[str, str]:
    out: dict[str, str] = {}
    p = Path(path)
    if not p.exists():
        return out
    for raw in p.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        if v.startswith('"') and v.endswith('"'):
            try:
                v = json.loads(v)
            except Exception:
                v = v[1:-1]
        out[k.strip()] = v.strip()
    return out


def apply(env: dict[str, str]) -> None:
    for k, v in env.items():
        os.environ.setdefault(k, v)
