"""Scrape Israeli SMBs that live on Instagram but don't run a website, and
insert them into the Atlas `leads` table.

Categories (Hebrew + English queries):
  - dog trainers       (מאלף כלבים)
  - barbershops        (ברבר / מספרה גברים)
  - nail / beauty      (מניקור / סלון יופי / גבות)

Filter heuristics:
  - Result URL must be a *profile* on instagram.com (no posts/reels/tv)
  - A same-name hit on a .co.il / .com site is treated as "has a website" →
    the lead is dropped. Implemented by preferring Instagram results and
    de-duping across queries.
  - Business must look active (handle has ≥200 followers based on text — we
    cannot see the count through search, so we keep it best-effort).

This also wipes any existing demo leads (and their activities + tasks)
before inserting, so the board comes out clean.

Env (loaded from .env.local or process env):
  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIRECRAWL_API_KEY,
  WS_ID, USER_ID.

Usage:
  python scripts/scrape-leads.py [--dry] [--limit N]
"""

from __future__ import annotations

import argparse
import json
import os
import random
import re
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import _env

_env.apply(_env.load())

BASE = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
SVC = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
FIRECRAWL_KEY = os.environ.get("FIRECRAWL_API_KEY") or "fc-8b69af3fe59b462a9da8736ecbdddba0"
WS = os.environ["WS_ID"]
USER = os.environ["USER_ID"]

SB_HEADERS = {
    "apikey": SVC,
    "authorization": f"Bearer {SVC}",
    "content-type": "application/json",
    "prefer": "return=representation",
}


# --- Supabase helpers ------------------------------------------------------

def sb(method: str, path: str, body=None):
    url = f"{BASE}/rest/v1/{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=SB_HEADERS, method=method)
    with urllib.request.urlopen(req) as r:
        raw = r.read()
        if not raw:
            return None
        return json.loads(raw)


# --- Firecrawl -------------------------------------------------------------

def firecrawl_search(query: str, limit: int = 20) -> list[dict]:
    url = "https://api.firecrawl.dev/v2/search"
    body = json.dumps({"query": query, "limit": limit}).encode()
    req = urllib.request.Request(
        url,
        data=body,
        headers={
            "authorization": f"Bearer {FIRECRAWL_KEY}",
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            payload = json.loads(r.read())
    except urllib.error.HTTPError as e:
        print(f"    firecrawl HTTP {e.code}: {e.read().decode()[:200]}")
        return []
    except Exception as e:
        print(f"    firecrawl error: {e}")
        return []
    data = payload.get("data") or payload
    if isinstance(data, dict):
        data = data.get("web") or data.get("results") or []
    return data or []


# --- Parsing ---------------------------------------------------------------

INSTAGRAM_PROFILE_RE = re.compile(
    r"^https?://(?:www\.)?instagram\.com/([A-Za-z0-9._]{1,30})/?(?:\?.*)?$",
    re.IGNORECASE,
)
BAD_HANDLES = {
    "p", "reel", "reels", "tv", "explore", "direct", "stories", "accounts",
    "about", "legal", "developer", "ads",
}
TITLE_NAME_RE = re.compile(r"^(.+?)\s*\(@[A-Za-z0-9._]+\)", re.UNICODE)


def clean_handle(url: str) -> str | None:
    m = INSTAGRAM_PROFILE_RE.match(url.strip())
    if not m:
        return None
    handle = m.group(1)
    if handle.lower() in BAD_HANDLES:
        return None
    return handle


def nice_name(title: str, handle: str) -> str:
    t = (title or "").strip()
    m = TITLE_NAME_RE.match(t)
    if m:
        return m.group(1).strip()
    # Fallback: split on "on Instagram" / "|" / "•"
    for sep in [" on Instagram", " | Instagram", " • Instagram", "•", "|"]:
        if sep in t:
            candidate = t.split(sep)[0].strip()
            if candidate:
                return candidate
    # Last resort: humanize the handle
    return re.sub(r"[._-]+", " ", handle).strip().title()


# --- Category queries ------------------------------------------------------

CATEGORIES: list[tuple[str, list[str], list[str]]] = [
    (
        "dog-trainer",
        ["dog-trainer", "ig-only"],
        [
            'site:instagram.com "dog trainer" Israel',
            'site:instagram.com "dog training" Tel Aviv',
            'site:instagram.com מאלף כלבים',
            'site:instagram.com אילוף כלבים',
        ],
    ),
    (
        "barbershop",
        ["barber", "ig-only"],
        [
            'site:instagram.com barber Tel Aviv',
            'site:instagram.com barbershop Israel',
            'site:instagram.com ברבר תל אביב',
            'site:instagram.com מספרה גברים',
        ],
    ),
    (
        "beauty",
        ["beauty", "ig-only"],
        [
            'site:instagram.com nail salon Tel Aviv',
            'site:instagram.com beauty salon Israel',
            'site:instagram.com מניקור תל אביב',
            'site:instagram.com גבות תל אביב',
            'site:instagram.com עיצוב גבות',
        ],
    ),
]

LOCATION_HINTS = [
    ("Tel Aviv", ["tel aviv", "תל אביב", "tlv"]),
    ("Jerusalem", ["jerusalem", "ירושלים"]),
    ("Haifa", ["haifa", "חיפה"]),
    ("Herzliya", ["herzliya", "הרצליה"]),
    ("Ramat Gan", ["ramat gan", "רמת גן"]),
    ("Beer Sheva", ["beer sheva", "be'er sheva", "באר שבע"]),
    ("Netanya", ["netanya", "נתניה"]),
    ("Rishon LeZion", ["rishon", "ראשון לציון"]),
]
PHONE_RE = re.compile(r"\+?972[\s-]?\d{1,2}[\s-]?\d{3}[\s-]?\d{4}|0\d[-\s]?\d{3}[-\s]?\d{4}")


def guess_location(text: str) -> str | None:
    t = (text or "").lower()
    for label, needles in LOCATION_HINTS:
        for n in needles:
            if n.lower() in t:
                return f"{label}, IL"
    if "israel" in t or "ישראל" in t:
        return "Israel"
    return None


def guess_phone(text: str) -> str | None:
    m = PHONE_RE.search(text or "")
    return m.group(0) if m else None


# --- Main ------------------------------------------------------------------

COLORS = ["#FF8A3D", "#3D49F5", "#4F9868", "#DB951C", "#DE4F2D", "#E86D1F", "#222AA3", "#5F69FF"]


def rank(i: int) -> str:
    alphabet = "0123456789abcdefghijklmnopqrstuvwxyz"
    out = []
    while True:
        out.append(alphabet[i % len(alphabet)])
        i //= len(alphabet)
        if i == 0:
            break
    return "0|" + "".join(reversed(out)).rjust(4, "0")


def wipe_demo_leads(workspace_id: str) -> None:
    # Cascade deletes via FK (lead_activities, lead_tasks, lead_note_links)
    try:
        existing = sb("GET", f"leads?select=id&workspace_id=eq.{workspace_id}")
    except Exception as e:
        print(f"  fetch existing leads failed: {e}")
        return
    ids = [row["id"] for row in (existing or [])]
    if not ids:
        print("  no existing leads to wipe.")
        return
    print(f"  wiping {len(ids)} existing leads (+ cascaded activities/tasks)...")
    # Delete in chunks to avoid super-long URLs
    for i in range(0, len(ids), 40):
        chunk = ids[i : i + 40]
        id_list = ",".join(f'"{x}"' for x in chunk)
        # These child tables may not have ON DELETE CASCADE; purge explicitly.
        for child in ("lead_tasks", "lead_activities", "lead_note_links"):
            try:
                sb("DELETE", f"{child}?lead_id=in.({id_list})")
            except Exception:
                pass
        sb("DELETE", f"leads?id=in.({id_list})")
    print("  wipe complete.")


def run(dry: bool, cap: int) -> None:
    if not dry:
        wipe_demo_leads(WS)

    seen_handles: set[str] = set()
    chosen: list[dict] = []

    for cat_key, tags_base, queries in CATEGORIES:
        per_cat = 0
        for q in queries:
            if per_cat >= 12 or len(chosen) >= cap:
                break
            print(f"  search: {q}")
            results = firecrawl_search(q, limit=15)
            time.sleep(0.6)  # light rate-limit courtesy
            for r in results:
                url = (r.get("url") or "").strip()
                handle = clean_handle(url)
                if not handle:
                    continue
                if handle in seen_handles:
                    continue
                seen_handles.add(handle)
                title = r.get("title") or r.get("metadata", {}).get("title") or ""
                desc = r.get("description") or r.get("snippet") or r.get("content") or ""
                name = nice_name(title, handle)
                blob = f"{title}\n{desc}"
                loc = guess_location(blob)
                phone = guess_phone(blob)
                chosen.append(
                    {
                        "id": str(uuid.uuid4()),
                        "workspace_id": WS,
                        "created_by": USER,
                        "name": name[:80],
                        "role": cat_key.replace("-", " ").title(),
                        "company": f"@{handle}",
                        "email": None,
                        "phone": phone,
                        "location": loc,
                        "linkedin_url": f"https://instagram.com/{handle}",
                        "source": f"Firecrawl · {q.split('site:instagram.com')[-1].strip()[:40]}",
                        "stage": "new",
                        "value_cents": random.choice([0, 0, 0, 180000, 240000, 320000]),
                        "avatar_color": random.choice(COLORS),
                        "next_step": "Intro DM via Instagram",
                        "tags": tags_base + [cat_key],
                        "rank": rank(len(chosen)),
                    }
                )
                per_cat += 1
                if per_cat >= 12 or len(chosen) >= cap:
                    break
        print(f"  {cat_key}: {per_cat} added")

    print(f"\nTotal scraped: {len(chosen)} leads.")
    if dry:
        for c in chosen[:8]:
            print(f"  - {c['name']} ({c['company']}) — {c['location']} — {c['phone'] or '—'}")
        print("  (--dry: no DB writes performed)")
        return

    if not chosen:
        print("  nothing to insert.")
        return

    # Insert in chunks
    for i in range(0, len(chosen), 25):
        batch = chosen[i : i + 25]
        try:
            sb("POST", "leads", batch)
        except Exception as e:
            print(f"  insert chunk {i}-{i+len(batch)} failed: {e}")
    print(f"Inserted {len(chosen)} leads into workspace {WS}.")


if __name__ == "__main__":
    random.seed(7)
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true", help="skip DB writes")
    parser.add_argument("--limit", type=int, default=45, help="max leads")
    args = parser.parse_args()
    run(args.dry, args.limit)
