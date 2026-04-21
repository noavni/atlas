"""Full workspace wipe — nukes leads, activities, tasks, cards, columns, boards,
projects, pages, blocks, links, inbox_items, attachments. Keeps workspace +
members.

Usage:
  WS_ID=... python scripts/wipe-workspace.py
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import _env

_env.apply(_env.load())

SVC = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
WS = os.environ["WS_ID"]

H = {
    "apikey": SVC,
    "authorization": f"Bearer {SVC}",
    "content-type": "application/json",
    "prefer": "return=minimal",
}


def sb(method: str, path: str):
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", headers=H, method=method)
    try:
        urllib.request.urlopen(req).read()
        return True
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:200] if hasattr(e, "read") else ""
        print(f"  {method} {path}: HTTP {e.code} {body}")
        return False
    except Exception as e:
        print(f"  {method} {path}: {e}")
        return False


# Order matters — delete children first
CHILDREN = [
    "lead_activities",
    "lead_tasks",
    "lead_note_links",
    "leads",
    "cards",
    "columns",
    "boards",
    "projects",
    "blocks",
    "links",
    "pages",
    "inbox_items",
    "attachments",
    "audit_log",
]

for table in CHILDREN:
    print(f"wipe {table} ...")
    sb("DELETE", f"{table}?workspace_id=eq.{WS}")

print("done.")
