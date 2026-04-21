# Atlas

> A private two-person knowledge workspace — the lovechild of Notion, Obsidian, Linear, and Apple Notes. Quiet, literate, fast. An app that feels like a very expensive object.

**Status:** Phase 0 — scaffold & design system.

## Stack

- **Frontend:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · Tiptap
- **Backend:** FastAPI on Vercel Python functions
- **Data:** Supabase (Postgres + Auth + Storage + Realtime + pgvector + pgmq + pg_cron)
- **Deploy:** Single Vercel Hobby project · Supabase Free

## Four pillars

1. **Project boards** — Kanban-first, optimistic, realtime, drag with mass
2. **Notes** — block-based, typography-forward, `[[wikilinks]]` with live backlinks
3. **Brain-dump inbox** — frictionless capture (text, voice, image, file, link); organize later
4. **Knowledge graph** — every note is connected; traverse visually and by command palette

## Repo layout

See [the build plan](../../.claude/plans/build-private-project-federated-pelican.md) for the full architecture. Quick map:

```
app/              Next.js App Router pages
components/       React components (primitives, shell, board, notes, inbox, graph, palette)
lib/              Client-side helpers (Supabase client, API wrapper, TanStack Query hooks, Zustand stores)
design-system/    Design tokens (CSS), assets, and original JSX/HTML reference prototypes
api/              FastAPI Python serverless functions (served under /api/*)
supabase/         SQL migrations, seed, local config
tests/            pytest (api) + Playwright (e2e)
```

## Local development

```sh
pnpm install
cp .env.example .env.local   # fill in Supabase + worker secret
pnpm dev                      # Next.js on :3000
```

Python backend (requires Python 3.12):

```sh
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -e ".[dev]"
uvicorn api.index:app --reload --port 8000
```

Supabase (requires Supabase CLI):

```sh
supabase start
supabase db reset
```

## Deploy

Single Vercel project. On `main`:

- Next.js builds and serves the frontend
- Python functions under `api/*` serve the backend
- `pg_cron` inside Supabase calls `/api/internal/worker/drain` every minute

No paid add-ons. Free tier only.

## Design

Atlas has a dedicated design system in `design-system/`:

- `colors_and_type.css` — color tokens (light + dark), typography scale, layout sizes
- `motion.css` — springs, durations, easing
- `assets/` — logomark and wordmark SVGs
- `reference/` — the original design bundle (JSX prototypes + HTML previews + brief)

Production components recreate the reference designs with identical visual output; Tailwind reads directly from the CSS tokens.

---

Private repo. Not accepting PRs.
