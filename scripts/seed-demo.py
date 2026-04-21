#!/usr/bin/env python
"""One-shot seed script — populates leads, activities, tasks, board cards,
inbox items, and starter notes for the Atlas workspace.

Run against Supabase REST with the service role key.

Usage:
    SVC=... WS_ID=... USER_ID=... python scripts/seed-demo.py
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from urllib import request

SVC = os.environ["SVC"]
WS = os.environ["WS_ID"]
USER = os.environ["USER_ID"]
BASE = "https://gurtxcfjakaxazqbfnaf.supabase.co/rest/v1"
NOW = datetime.now(timezone.utc)


def post(path: str, body):
    req = request.Request(
        f"{BASE}/{path}",
        data=json.dumps(body).encode(),
        headers={
            "apikey": SVC,
            "authorization": f"Bearer {SVC}",
            "content-type": "application/json",
            "prefer": "return=representation",
        },
        method="POST",
    )
    with request.urlopen(req) as r:
        return json.loads(r.read())


def get(path: str):
    req = request.Request(f"{BASE}/{path}", headers={"apikey": SVC, "authorization": f"Bearer {SVC}"})
    with request.urlopen(req) as r:
        return json.loads(r.read())


def rank(i: int) -> str:
    return f"0|{chr(ord('U') + i)}"


# --- 1. Leads -------------------------------------------------------------
leads_seed = [
    ("Maya Greenberg", "Co-founder", "Ferngrove Studio", "maya@ferngrove.co", "+1 415 552 0198", "Brooklyn, NY", "Referral - Jules", "proposal", 24000, "MG", "#FF8A3D", "Send revised proposal", ["consulting", "q2"], 2),
    ("Arjun Patel", "Head of Design", "Lumen Health", "arjun@lumen.health", "+1 646 318 4402", "San Francisco, CA", "LinkedIn inbound", "qualified", 42000, "AP", "#3D49F5", "Schedule discovery v2", ["enterprise", "design-system"], 4),
    ("Sofia Navarro", "Creative Director", "Paragon & Pine", "sofia@paragon.design", "+1 213 998 1120", "Los Angeles, CA", "Cold email", "contacted", 8500, "SN", "#4F9868", "Share case study", ["creative", "small"], 12),
    ("Ethan Cole", "Product Manager", "Atlas Holdings", "ethan@atlas.io", "+1 415 339 2211", "Austin, TX", "Referral - Maya", "won", 72000, "EC", "#DB951C", "", ["annual", "priority"], 72),
    ("Riya Kapoor", "VP Engineering", "Ostrea", "riya@ostrea.co", "+1 212 992 3004", "New York, NY", "Event - NYC dinner", "qualified", 55000, "RK", "#DE4F2D", "Send technical brief", ["technical", "enterprise"], 36),
    ("Jules Harding", "Founder", "Silverlake Press", "jules@silverlake.press", "+1 917 888 2244", "Los Angeles, CA", "Referral - prior client", "new", 12000, "JH", "#FF8A3D", "Intro call", ["publishing"], 1),
    ("Noa Eshel", "Operations Lead", "Kinder Co.", "noa@kinder.co", "+972 54 219 3322", "Tel Aviv, IL", "Partner referral", "contacted", 18000, "NE", "#3D49F5", "Share scope doc", ["operations", "i18n"], 24),
    ("Leo Bernard", "CEO", "Bernard Atelier", "leo@bernard.atelier", "+33 1 42 86 00 21", "Paris, FR", "Press mention", "proposal", 38000, "LB", "#4F9868", "Awaiting contract sign", ["eu", "q3"], 6),
    ("Priya Menon", "Director of Marketing", "Moonlit", "priya@moonlit.io", "+1 503 442 1180", "Portland, OR", "Webinar signup", "qualified", 16500, "PM", "#FF8A3D", "Send proposal draft", ["marketing"], 48),
    ("Tomas Riquelme", "Head of Research", "Quinta Labs", "tomas@quinta.lab", "+56 2 2599 1187", "Santiago, CL", "Inbound form", "lost", 6000, "TR", "#DE4F2D", "Revisit Q4", ["research", "postponed"], 168),
]

lead_rows = []
for i, (name, role, company, email, phone, location, source, stage, value, init, color, nxt, tags, hours) in enumerate(leads_seed):
    lead_rows.append({
        "id": str(uuid.uuid4()),
        "workspace_id": WS,
        "name": name, "role": role, "company": company,
        "email": email, "phone": phone, "location": location,
        "source": source, "stage": stage, "value_cents": value * 100,
        "owner_id": USER, "tags": tags, "avatar_color": color,
        "avatar_initials": init, "next_step": nxt,
        "last_touched_at": (NOW - timedelta(hours=hours)).isoformat(),
        "rank": rank(i),
        "created_by": USER,
    })
leads = post("leads", lead_rows)
print(f"leads: {len(leads)}")


# --- 2. Activities --------------------------------------------------------
activity_templates = [
    ("call", "Discovery call", "45 min - deep on brand direction, timeline, and team capacity. Shared the Linear docs.", 48),
    ("email", "Sent proposal v1", "Scope: 8-week engagement, two brand directions, kickoff week of May 12.", 30),
    ("stage", "Moved to qualified", "Warmed up in call; comfortable on budget and scope.", 72),
    ("note", "Internal debrief", "Pair with Maya on tone. Lead favours editorial serif over geometric.", 20),
    ("email", "Follow-up question", "Asked about retainer vs project fee. Positive signal.", 10),
    ("meeting", "Kickoff held", "Aligned on weekly cadence, Slack connect, shared milestones.", 6),
]
act_rows = []
for r in leads:
    take = 6 if (hash(r["id"]) % 2 == 0) else 5
    for j, (kind, headline, detail, hours) in enumerate(activity_templates[:take]):
        act_rows.append({
            "workspace_id": WS, "lead_id": r["id"], "actor_id": USER,
            "kind": kind, "headline": headline, "detail": detail,
            "created_at": (NOW - timedelta(hours=hours + j)).isoformat(),
        })
post("lead_activities", act_rows)
print(f"activities: {len(act_rows)}")


# --- 3. Tasks -------------------------------------------------------------
task_rows = []
for r in leads[:6]:
    for j, (title, days, done) in enumerate([
        ("Draft follow-up email", 1, False),
        ("Pull similar past work into deck", 3, False),
        ("Confirm timeline with Alex", 5, True),
    ]):
        task_rows.append({
            "workspace_id": WS, "lead_id": r["id"], "title": title,
            "due_at": (NOW + timedelta(days=days)).isoformat(),
            "done": done,
            "done_at": (NOW - timedelta(days=1)).isoformat() if done else None,
            "rank": rank(j),
        })
post("lead_tasks", task_rows)
print(f"tasks: {len(task_rows)}")


# --- 4. Board cards (Home project) ---------------------------------------
BOARD_ID = "94799f41-d2bc-4a85-ad33-58eb5ac17137"
PROJECT_ID = "d886ed6c-b65c-4f71-b908-acbe485efe47"

cols = get(f"columns?select=id,name,default_workflow_state&board_id=eq.{BOARD_ID}&order=rank")
col_by_state = {c["default_workflow_state"]: c for c in cols}

# Add In review if missing
if "in_review" not in col_by_state:
    nc = post("columns", [{
        "workspace_id": WS, "board_id": BOARD_ID, "name": "In review",
        "rank": "0|X", "default_workflow_state": "in_review",
    }])[0]
    col_by_state["in_review"] = nc
    print("added in_review column")

card_seed = [
    ("backlog", "Research indigo-on-paper accessibility", "WCAG AA across warm neutrals. Compare vs. existing accent usage.", 14),
    ("backlog", "Pick interior door hardware", "Match tone with the kitchen pulls - matte brass, not polished.", 10),
    ("todo", "Porch light - pick warm temp", "Leaning toward 2700K. Confirm glow against the cedar.", 3),
    ("todo", "Draft Lisbon itinerary v2", "Five days, two neighborhoods, one lazy day. Room for a surprise.", 5),
    ("todo", "Order paint sample trio", "Greenwich White, Shoji White, Swiss Coffee. One quart each.", 7),
    ("in_progress", "Kitchen island lighting quote", "Request two options from the retail. Email Anna.", 1),
    ("in_progress", "Reading list triage", "Cull to 12. Anything past 2 years moves to Archive.", 2),
    ("in_review", "Invitation copy - wedding", "Revise opening line; Sofia likes the current voice. Jules nudged warmer.", 4),
    ("in_review", "Lisbon flight - hold decision", "17th vs 18th departure. Hold is good until Friday 6pm.", 1),
    ("done", "Choose kitchen paint", "Went with Greenwich White. Two coats. Trim slightly warmer.", 30),
    ("done", "Finalize wedding date", "Second weekend in October. Locked with venue.", 40),
    ("done", "Book flights home for mom birthday", "Booked direct. Window aisle. Morning arrival.", 60),
]

cards_payload = []
for i, (state, title, desc, days) in enumerate(card_seed):
    col = col_by_state.get(state)
    if not col:
        continue
    cards_payload.append({
        "id": str(uuid.uuid4()),
        "workspace_id": WS,
        "project_id": PROJECT_ID,
        "board_id": BOARD_ID,
        "column_id": col["id"],
        "title": title, "description": desc,
        "workflow_state": state,
        "rank": rank(i),
        "created_by": USER,
        "due_at": (NOW + timedelta(days=days % 7 + 1)).isoformat() if days < 30 else None,
    })
post("cards", cards_payload)
print(f"cards: {len(cards_payload)}")


# --- 5. Inbox items -------------------------------------------------------
inbox_seed = [
    ("text", "Idea: a weekly letter we send each other on sundays, just to ourselves.", 0),
    ("voice", "Voice memo 1:14 - think the kitchen paint should lean warmer than the living room, it will glow in the afternoon light.", 2),
    ("url", "nytimes.com - Why we walk", 4),
    ("image", "Porch-light-options.heic", 6),
    ("text", "Book flights home for my mother's birthday. Before end of month.", 26),
    ("text", "Lisbon: check if Sintra has a reservation system in July.", 28),
    ("file", "Wedding-budget-v3.pdf - 142 KB", 48),
]
inbox_payload = []
for i, (kind, text, hours) in enumerate(inbox_seed):
    inbox_payload.append({
        "id": str(uuid.uuid4()),
        "workspace_id": WS,
        "user_id": USER,
        "kind": kind,
        "raw_text": text,
        "attachments": [],
        "status": "inbox",
        "captured_at": (NOW - timedelta(hours=hours)).isoformat(),
        "client_idempotency_key": f"seed-{i}-{uuid.uuid4().hex[:8]}",
    })
post("inbox_items", inbox_payload)
print(f"inbox: {len(inbox_payload)}")


# --- 6. Notes -------------------------------------------------------------
notes_seed = [
    ("On quiet tools", [
        "A tool should disappear into your hand. You stop noticing the pen; the thought travels through it.",
        "The best things we own feel obvious. There's a particular pen I've been writing with for four years - a matte-black Lamy that weighs almost nothing.",
    ]),
    ("On patience and compound things", [
        "Everything good is slow. Paint cures. Dough proves. Relationships stretch.",
        "The things we love about old places - the rugs that have seen ten winters - arrive only by waiting.",
    ]),
    ("Paint palette", [
        "Kitchen: Greenwich White.",
        "Entry: Shoji warmer.",
        "Trim: a half-shade down.",
    ]),
    ("Weekly review - Apr 14", [
        "Shipped proposal for Maya. Felt good. Ethan's contract is in. Jules wants intro call.",
        "Next week: close the loop on Arjun, push Priya to proposal.",
    ]),
    ("Books to buy", [
        "A Pattern Language - again.",
        "The Power Broker - long-haul.",
        "Just Kids - keep a copy in the guest room.",
    ]),
]
pages_payload = []
for i, (title, paras) in enumerate(notes_seed):
    doc = {"type": "doc", "content": [
        {"type": "paragraph", "content": [{"type": "text", "text": p}]} for p in paras
    ]}
    pages_payload.append({
        "id": str(uuid.uuid4()),
        "workspace_id": WS,
        "title": title,
        "content": doc,
        "rank": rank(i),
        "created_by": USER,
    })
post("pages", pages_payload)
print(f"notes: {len(pages_payload)}")

print("\nDONE")
