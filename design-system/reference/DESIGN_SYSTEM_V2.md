# Handoff: Atlas Redesign

> A private project + knowledge workspace for two people — the lovechild of Notion, Obsidian, Linear, and Apple Notes, designed with a 2026 Apple sensibility. This handoff covers the full redesign across five surfaces, with a new **Leads** section added to the original brief.

---

## About the Design Files

The HTML file in this bundle — **`Atlas Redesign.html`** — is a **design reference**, not production code. It's a single-file clickable prototype built with vanilla JS/CSS + React-lite sprinkles, used to communicate intended look, interactions, and motion. Your job is to **recreate these designs in the target codebase's existing environment** (the `reference/` folder suggests Next.js + Tailwind + React) using its established component patterns — not to lift the HTML verbatim.

All tokens (`colors_and_type.css`, `motion.css`) are production-ready and can be copied directly or translated into your theme system. See `reference/tailwind.config.ts` and `reference/globals.css` for how the tokens are already wired into Tailwind — favor extending that.

---

## Fidelity

**High-fidelity.** Colors, typography, spacing, radii, shadows, motion curves, and copy are all final. Pixel-level adherence expected for the five core screens. Interactions (drawer slide, card hover lift, stage-bar state, tabs, command palette) have specific timing documented below — match them.

---

## Project structure

```
design_handoff_atlas_redesign/
├── README.md                          ← this file
├── Atlas Redesign.html                ← the prototype (open in a browser)
├── design-system/
│   ├── colors_and_type.css            ← all design tokens (light + dark)
│   └── motion.css                     ← spring curves, easings, shadows, radii
└── reference/
    ├── tailwind.config.ts             ← existing token → tailwind mapping
    └── globals.css                    ← existing globals (keep compatible)
```

Open `Atlas Redesign.html` directly in a browser to see everything. Use the bottom tab bar (Board / Notes / Inbox / Leads / Graph) or keyboard shortcuts `⌘1–⌘5`. Press `⌘K` for the command palette, `⌘⇧L` for new lead.

---

## Screens / Views

There are **five top-level screens** plus multiple sub-views inside Leads.

### 1. Shell (shared across all screens)

**Layout:** two-column app frame, 1360 × 860 with 24px outer margin.

- **Sidebar** (260px, `bg: --surface-app`, border-inline-end: 1px `--border-subtle`)
  - Brand block: gradient orb mark (28px) with radial highlight + "Atlas / Private workspace"
  - Nav items: Inbox (badge 12), Boards, Notes, Leads (badge 24), Graph — 16px lucide icons, 13px 500-weight, active state uses `--surface-2` + `--shadow-1`, active icon tinted `--accent-primary`
  - Sections: Projects (4 colored dots) and Pinned (2 note links)
  - Footer: Settings
- **Topbar** (52px, `bg: --material-thick` with `backdrop-filter: blur(24px) saturate(140%)`, border-bottom 1px)
  - Breadcrumb left (`Atlas / <Screen>`)
  - Centered command trigger pill — `--surface-2`, 440px max, shows `⌘K` kbd — click opens palette
  - Right: RTL toggle, theme toggle, "Ask" pill, avatar (orange gradient, initial)
- **Floating bottom tab bar** (`position: fixed`, bottom 16px, centered): pill with 5 buttons, active uses `--accent-primary` + `--fg-on-accent`

### 2. Board (Kanban)

**Purpose:** project board; default active on first load.

- Page header: eyebrow ("Atlas app · project board", 11px uppercase, letter-spacing 0.06em, `--fg-3`), h1 "Ship v0.2" (32px Instrument Serif, -0.02em), subtitle "12 active, 3 in review · last update 4m ago"
- Actions: Filter (ghost), Group (secondary), New card (primary)
- **5 columns** — Backlog, To do, In progress, In review, Done — each 300px wide, `--surface-2` bg, 14px radius, 10px padding
- Column header: colored dot (9px), name (13px 600), count pill (`--surface-raised`)
- **Cards** (`--surface-raised`, 12px radius, `--shadow-1`, hover lifts `translateY(-2px)` with `--shadow-2` and 180ms `--spring-gentle`):
  - Tag pill (10.5px uppercase-ish, 4px radius) — colored per column (indigo/apricot/sage/amber/neutral)
  - Title (13.5px 500, -0.005em letter-spacing)
  - Description (12.5px `--fg-3`, 2-line clamp)
  - Meta row: calendar icon + due, link icon + count, avatar stack
- "Add card" ghost row at bottom of each column

### 3. Notes

**Purpose:** block-based editor with backlinks.

**Layout:** 3-column grid (`280px 1fr 260px`):

- **Left rail (notes list)** — 280px, border-inline-end. List header "All notes · 42" + "+ New" iconbtn. Rows: title (13px 600), preview (12px `--fg-3`, 2-line clamp), meta (10.5px `--fg-4`). Active row uses `--accent-tint` bg with indigo border.
- **Editor** — centered column, max-width 680px, 48px vertical padding
  - Title: 40px Instrument Serif, 600, -0.022em, line-height 1.1
  - Read-meta row (12px, `--fg-3`): edited time · backlinks · links out
  - Body: `--font-serif` (Source Serif 4), 18px, 1.68 line-height, `--fg-1`
  - Wiki-links `[[Title]]`: `--accent-primary` with 40% alpha underline
  - Mentions `@Name`: apricot-tinted chip (1px 7px padding, 4px radius) — clicks open Lead drawer
  - Blockquote: serif italic, 2px indigo left border, 19px
  - H2: 24px Instrument Serif
- **Right rail (backlinks)** — 260px, border-inline-start, `bg: --surface-app`
  - "Backlinks · 3" section with clickable cards
  - "Mentioned" section with mini avatar + name + subtitle → opens Lead drawer

### 4. Inbox (Brain dump)

**Purpose:** fast, almost-thoughtless capture surface.

- Centered 760px column, 36px top padding
- Header: eyebrow "Tuesday · inbox", h1 "Brain dump" (36px Instrument Serif), helper ("7 things to organize. No hurry."), right-side "Quick capture" pill (`⌘N`)
- Filter tabs (pill segmented control): All / Text / Voice / Links / Files — active uses `--surface-raised` + `--shadow-1`
- Groups by day ("Today", "Yesterday") with 11px uppercase section header
- **Capture items** (`--surface-raised`, 12px radius, `--shadow-1`, hover reveals actions):
  - Left icon chip (32px, colored per kind: text=neutral, voice=apricot, image=sage, url=indigo, file=amber)
  - When meta (11px `--fg-3`) + main text (Source Serif 16px, 1.5 line-height)
  - Hover: action cluster (Note / Archive / Trash) fades in top-right; `transform: translateY(-1px)`, `--shadow-2`

### 5. Graph

**Purpose:** knowledge map — notes, leads, and tasks connected.

- Page header: eyebrow "knowledge map", h1 "Graph", subtitle "42 notes · 118 links · 6 clusters"
- Stage: 16px margin, 16px radius card (`--surface-raised`, `--shadow-1`), fills remaining height
- **Top-left toolbar** (glass chip): zoom in, zoom out, fit, divider, settings — `--material-thick` bg, blur(24px)
- **Bottom-left legend** (glass card): Notes (indigo), Leads (apricot), Tasks (sage)
- **Top-right side panel** (260px glass card): "SELECTED" label, selected-node title, stats (backlinks / out / mentions), divider, connected nodes list
- SVG graph: hand-placed 16 nodes, ~23 edges, deterministic layout. Big focus node ("On patience") drawn larger with white stroke + label below. Smaller nodes are simple circles with a 4px halo at 14% opacity.

### 6. Leads — Hub

**Purpose:** relationships + pipeline across three coordinated views.

- **Top section** (40px horizontal padding, 32px top):
  - Eyebrow "relationships · pipeline"
  - H1 "Leads" (32px Instrument Serif)
  - **4 stat cards** laid out in a row (gap 32px):
    1. `24` Active · `+3 this week` (sage caption)
    2. `$148k` Pipeline value · `+$22k this week`
    3. `7` Need follow-up · `3 overdue` (apricot caption)
    4. `68%` Close rate · 90d
  - Stat numbers: Instrument Serif 28px 600, -0.02em; label 11.5px `--fg-3`; caption 11px sage/apricot
  - Right-side actions: Export (secondary), **New lead** (primary, opens modal)
- **Toolbar** (14px/40px padding, `--surface-app` bg, 1px borders top + bottom):
  - **Segmented tabs** (left): Table / Pipeline / Timeline — 7px/14px padding, 8px radius; active uses `--surface-2` + darker text
  - Filter search pill (260px max), Stage filter button, Sort button

#### 6a. Table view (default)

- Full-width table inside a scrollable wrap (40px horizontal padding, 14px top margin)
- Columns: **Lead** (28%) · **Stage** (14%) · **Value** (14%) · **Last touch** (16%) · **Next step** (13%) · **Tags** (15%)
- TH: 11px 600 uppercase, 0.06em tracking, `--fg-3`, sticky top, white-bg
- TD: 14px padding, 13px, `--fg-1`; row hover = `--surface-hover`
- Lead cell: 30px colored avatar circle + name (13.5px 600) stacked over role (11.5px `--fg-3`)
- Stage cell: pill — see Stage Pills below
- Value cell: JetBrains Mono 12.5px 500, tabular-nums
- Tags cell: wrapping mini-tags (10.5px, `--surface-2` bg, 4px radius)
- On row hover, a floating action cluster appears on the right of the row (`--surface-raised`, 1px border, `--shadow-2`, 3px padding): Quick peek, Email, Schedule, More — each is a 26px iconbtn

#### 6b. Pipeline view (Kanban)

- 6 columns: New, Contacted, Qualified, Proposal, Won, Lost — 280px wide, `--surface-2` bg, 14px radius
- Column header: colored dot + name (uppercase, 12.5px 600, 0.04em tracking) + count
- Column totals row: JetBrains Mono, 11.5px, `--fg-3`; "Total $48,500"
- **Lead cards** (`--surface-raised`, 10px radius, `--shadow-1`, hover `translateY(-1px)` + `--shadow-2`):
  - Top row: 22px avatar + name (12.5px 600)
  - Role (11.5px `--fg-3`, 4px top)
  - Foot row: value (Mono 11.5px 600) + next-step chip with arrow icon
- Clicking a card opens the full Lead Detail page

#### 6c. Timeline view

- Scrollable column, 40px horizontal padding, 24px top
- Grouped by **day** with sticky day header: "Today" / "Yesterday" / "Apr 17" (Instrument Serif 18px 600) + subtitle (date)
- **Rows:** 3-column grid `78px 40px 1fr`:
  - Time (Mono 11.5px tabular-nums, `--fg-3`)
  - 32px colored circle icon — color varies by kind: call=indigo, email=apricot, note=sage, stage=amber
  - Body: avatar + name (clickable → Lead page) · action label + detail text (Source Serif 14.5px 1.5 line-height)
- Row dividers: 1px `--border-subtle` bottom

### 7. Leads — Full Detail Page

Replaces the hub when a lead is clicked from Table or Pipeline (`#leadsHub` hidden, `#leadDetailPage` shown — no modal, full-screen).

- **Top row** (24px/40px padding): `← Leads` back button, `/` separator, lead name, right-side prev/next/more iconbtns
- **Hero row** (20px/40px, border-bottom):
  - 72px colored avatar (26px font, 600)
  - Info block: name (Instrument Serif 28px 600), role (13.5px `--fg-3`), contact row (email, phone, location, LinkedIn — 12.5px, each with 13px lucide icon)
  - Right CTA cluster: Email (ghost), Schedule (secondary), **Draft follow-up** (primary with sparkles)
- **Stage bar** (0/40px): 5 equal-flex pills for New → Contacted → Qualified → Proposal → Won (Lost is separate, never in bar)
  - Done steps: sage-tinted bg + border, sage text, "✓ done" subtitle
  - Current: solid `--accent-primary`, `--fg-on-accent`, `--shadow-2`, "current" subtitle
  - Future: `--surface-2` bg, 1px `--border-subtle`, "—" subtitle
- **Two-column grid** (28px/40px padding, `1.4fr 1fr` gap 28px):
  - **Left column cards:**
    - **Add update** card with composer (Source Serif textarea, attach/tag/mic icons + Post button), + "AI summarize" action in header
    - **Activity** card · 14 — vertical timeline with 26px dots, connector line (1px `--border-subtle`), 7 items covering mentions / calls / emails / stage changes / referral add
    - **Emails** card · 6 — compact rows with SENT/RCVD direction pill (10px, uppercase), subject, date, 2-line preview
    - **Files** card · 4 — 32px colored icon (pdf=persimmon, doc=indigo, img=sage) + filename (13px 500) + metadata
  - **Right column cards:**
    - **Details** card: 2-col grid of key/value (K: 10.5px uppercase `--fg-3`; V: 13px 500): Stage, Value, Source, Owner, Created, Last touch
    - **Next steps** card · 3 — task rows with 16px circular check (sage fill when done, white check mark), strikethrough text for completed
    - **Linked notes** card · 3 — rows with file-text icon + title + relative time
    - **Tags** card — row of mini-tags + dashed `+ add` tag
    - **People** card · 2 — 22px avatar + name + role suffix

### 8. Leads — Quick-peek Drawer

Triggered from mentions in Notes (`@Name`), from the Mentioned rail, or from the command palette. A right-side drawer over the current screen (540px wide, `translateX` from `100%`, 300ms `cubic-bezier(0.32, 0.72, 0, 1)` — the iOS bounce).

- Head (20/24px, border-bottom): 32px avatar + name + role + close iconbtn
- Body: hero avatar (56px) + name + role + stage-pill aligned end
- Details grid (6 KV pairs) in a rounded card
- Sections: Linked notes (3), Activity (5 items), Tags
- Backdrop: `rgba(0,0,0,.3)` + 2px blur; clicking it or Esc closes

**RTL note:** drawer flips to left side, `transform: translateX(-100%)` → `0`.

### 9. Leads — New Lead Modal

Opens from `+ New lead` button or `⌘⇧L`.

- Modal: 560px, 16px radius, `--shadow-4`
- Header: indigo icon chip + "New lead" + close
- **AI-paste card** (dashed indigo border, accent-tinted bg): sparkles icon + "Paste anything — signature, business card OCR, LinkedIn URL — Atlas will fill the fields" + mono textarea for paste input
- Form: 2-col grid — Name, Role · company, Email, Phone, Source (select), Value, **Stage picker** (6 pills, single-select, active is solid accent), First note (full-width textarea, Source Serif)
- Footer: Cancel (ghost), Save & add another (secondary), **Save lead** (primary)

### 10. Command Palette

Opens with `⌘K` anywhere, Esc to close.

- Centered overlay, starts 14vh from top
- Panel: 560px, 16px radius, `--material-thick` + `backdrop-filter: blur(32px) saturate(180%)`, `--shadow-4`
- Search input row (14/18px padding, 16px search icon) + `Esc` kbd on right
- List sections (10.5px 600 uppercase section headers):
  - Suggested — specific notes + leads by name + cards
  - Navigate — Go to Inbox (`⌘1`) / Boards (`⌘2`) / Notes (`⌘3`) / Leads (`⌘4`) / Graph (`⌘5`)
  - Actions — New note (`⌘⇧N`) / New lead (`⌘⇧L`) / Quick capture (`⌘N`)
- Selected row uses `--accent-tint` bg with indigo icon
- Clicking a lead row navigates to Leads and auto-opens that lead's drawer

---

## Interactions & Behavior

- **Card drag-and-drop** (Board + Pipeline): drop indicator is a ghost card outline; spring-based with mass. Use `framer-motion` or `@dnd-kit` with a spring config `{ stiffness: 220, damping: 26, mass: 1 }`. Cards lift `translateY(-2px)` on hover over 180ms with `--spring-gentle`.
- **Mentions in Notes**: click `@Name` chip → `openLeadDrawer(id)` (see drawer transition below).
- **Lead drawer slide**: `transform: translateX(100%) → 0` over **300ms** with `cubic-bezier(0.32, 0.72, 0, 1)`. Scrim fades in over 200ms. RTL mirrors to left side.
- **Lead detail page**: no animation — replaces hub content directly to feel like native navigation. Back button returns to last-used Leads view.
- **Lead view tabs** (Table/Pipeline/Timeline): persist `.on` on the matching `.sub-screen`. Consider a 120ms fade; not required.
- **Task check toggle**: click the 16px chk → toggle `.done` class; chk fills sage, text gets line-through + `--fg-3`. 150ms.
- **Stage bar step click**: cycles current stage (not implemented in mock — treat as spec).
- **Command palette**: `⌘K` toggles open/close; Esc closes; arrow keys navigate (not implemented in mock — spec only).
- **Theme toggle**: `[data-theme="dark"]` on `<html>`. Icon swaps sun ↔ moon.
- **RTL toggle**: `dir="rtl"` on `<html>`; swaps nav labels to Hebrew; mirrors sidebar border, drawer direction, and all `inline-start/end` logical props.
- **Hover motion budget**: nothing faster than 120ms, nothing slower than 300ms unless it's the drawer (300ms) or the card lift spring.
- **Keyboard shortcuts**:
  - `⌘K` — command palette
  - `⌘N` — quick capture (spec)
  - `⌘⇧N` — new note (spec)
  - `⌘⇧L` — new lead (implemented)
  - `⌘1–5` — jump to Inbox / Boards / Notes / Leads / Graph (spec)
  - `Esc` — close any overlay

---

## State Management

Minimum state a real implementation needs:

- `leads: Lead[]` — id, name, role, avatar initials+color, stage, value, valNum, lastTouched, nextStep, tags, email, phone, location, source, owner, createdAt
- `notes: Note[]` — id, title, preview, body (blocks), backlinks, outbound links, mentions, createdAt, updatedAt
- `inbox: Capture[]` — id, kind (text/voice/image/url/file), content, capturedAt, processed
- `cards: BoardCard[]` — id, columnId, title, desc, due, links, assignees, tags
- UI state: `activeScreen`, `activeLeadView`, `selectedLeadId`, `drawerOpen`, `paletteOpen`, `theme`, `dir`, `density`
- Mentions in notes link by `leadId` — typeahead should query `leads` by prefix.
- Graph derives from notes + leads + tasks — each cross-reference is an edge.

Persist `theme`, `dir`, `density`, `activeScreen`, and `activeLeadView` to localStorage.

---

## Design Tokens

All in `design-system/colors_and_type.css` and already mapped in `reference/tailwind.config.ts`. Key values:

### Colors (light mode)

**Neutrals (warm paper):**
- `--neutral-50 #FBFAF7` — app bg
- `--neutral-100 #F5F3EE` — surface-2
- `--neutral-150 #EEECE5` — surface-3
- `--neutral-200 #E4E1D8` — subtle border
- `--neutral-300 #D0CCC0` — border
- `--neutral-500 #7E7B6E` — muted text
- `--neutral-600 #5E5B50` — secondary text
- `--neutral-800 #24221C` — ink (primary text)

**Indigo (accent):**
- `--indigo-500 #3D49F5` — primary accent
- `--indigo-600 #2E38D4` — primary hover
- `--indigo-50 #EDEEFF` — accent tint

**Apricot (second accent):**
- `--apricot-300 #FFD3A8`, `--apricot-500 #FF8A3D`, `--apricot-600 #E86D1F`

**Semantic:**
- Success `--sage-500 #4F9868` / `--sage-100 #DCEFE1`
- Warning `--amber-500 #DB951C` / `--amber-100 #F9ECC8`
- Danger `--persimmon-500 #DE4F2D` / `--persimmon-100 #FADBCE`

Dark mode inverts via `[data-theme="dark"]` — see `colors_and_type.css`.

### Typography

5 families, all free + Google Fonts:
- **`--font-ui` Inter** (400/500/600/700) — UI, nav, forms
- **`--font-display` Instrument Serif** — headlines, H1/H2 (note: CSS references `var(--font-display)`; swap in your stack to Instrument Serif or its fallback)
- **`--font-serif` Source Serif 4** — note body, inbox items, activity detail
- **`--font-mono` JetBrains Mono** — values, timestamps, kbd, tabular numbers
- **`--font-hebrew-ui` Heebo** + **`--font-hebrew-serif` Frank Ruhl Libre** — auto-swap when `dir="rtl"`

Size/weight pairs used:
- Display H1: 32–40px 600 -0.02em (Instrument Serif)
- Display H2: 24px 600 -0.015em
- Body: 13–13.5px 400–500
- Meta/caption: 11–12.5px
- Eyebrow: 11px 600 uppercase 0.06em tracking
- Numbers: Mono 11.5–12.5px, `font-variant-numeric: tabular-nums`

### Spacing

Card padding: 10–14px. Page padding: 24–40px. Section gap: 14–28px. Row gap: 8–14px.

### Radii

`--radius-sm 4px` · `--radius-md 8px` · `--radius-lg 12px` · `--radius-xl 14–16px` · pill `9999px`

### Shadows

`--shadow-1` (hairline rest), `--shadow-2` (hover), `--shadow-3` (floating nav/panel), `--shadow-4` (modal/drawer). All in `motion.css`.

### Motion

- `--spring-gentle` — card hover lift
- `--spring-snap` — toggles, filters
- `--spring-bounce` — reveals
- `--ease-in-out` — default
- `--ease-out-quart` — drawer entrance (or `cubic-bezier(0.32, 0.72, 0, 1)` matching iOS)

---

## Assets

- **Icons**: [Lucide](https://lucide.dev) — the prototype loads via CDN `<script>`. In production use `lucide-react`. Every icon used in the mock is named `<i data-lucide="NAME">` — search the HTML for the list.
- **Fonts**: Google Fonts (imported at the top of `colors_and_type.css`). Swap to self-hosted `.woff2` for production.
- **Avatars**: initials on colored circles — deterministic color per lead (hard-coded in the mock's `leads[]` array).
- **Brand mark**: CSS-only — a radial-gradient sphere with a pseudo-element highlight. Lift the `.sb-brand .mark` rules or rebuild as SVG.

No raster imagery is required.

---

## Files to reference

- **`Atlas Redesign.html`** — the prototype. Sections are labelled with HTML comments (`<!-- ======= LEADS SCREEN ======= -->` etc.).
- **`design-system/colors_and_type.css`** — all color + type tokens, light + dark
- **`design-system/motion.css`** — shadows, radii, springs, easings
- **`reference/tailwind.config.ts`** — Tailwind theme extension mapping tokens to utilities
- **`reference/globals.css`** — existing app globals

---

## Implementation notes

1. Start with tokens: copy `design-system/*.css` into your app and verify the Tailwind mapping covers every token you need.
2. Build the shell (sidebar + topbar + bottom tab bar) first — every screen lives inside it.
3. Build screens in this order: Board → Inbox → Notes → Graph → Leads (largest surface, build last). Within Leads: Table → Pipeline → Timeline → Detail page → Drawer → New Lead modal.
4. Use `framer-motion` for the drawer, card hover, and view transitions. Keep all durations inside the 120–300ms envelope.
5. Wire the command palette with a fuzzy search lib (Fuse.js or cmdk). Bind `⌘K` globally; don't trap focus outside the palette input.
6. For RTL: use `inline-start`/`inline-end` logical properties everywhere; no `left`/`right`. All icons with directional meaning (arrows, chevrons) must flip.
