# Atlas — Design System

> A private knowledge workspace for two. Calm, luxurious, responsive — an app that feels like a very expensive object.

Atlas is a greenfield product: a private project + knowledge workspace for the user and their partner. It sits at the intersection of **Notion, Obsidian, Linear, and Apple Notes**, designed as though it were built in 2026 by a team that cares deeply about typography, motion, and restraint.

This design system establishes the brand direction, visual foundations, and UI kit that every Atlas surface is built from.

---

## Product context

Atlas has four core surfaces:

1. **Project boards** — Kanban-first, with list and timeline views. Visual, smooth, drag-first.
2. **Notes** — Block-based editor. Typography-forward. Rich content. Links to other notes.
3. **Brain dump inbox** — Fast, almost-thoughtless capture of text, voice, images, files, links. Messy by design. Later organized.
4. **Knowledge graph** — Every note references others. A beautiful, legible view of how things connect.

Plus connective tissue: a **global quick-capture overlay**, a **Raycast-style command palette**, **backlinks panels**, and **settings**.

### The feel

> Luxurious. Calm. Confident. Nothing shouts; everything responds. 60fps everywhere. The app should feel like a very expensive, very well-made object — not a web app.

The aesthetic anchor is Apple circa 2026. Spacious. Restrained color. Soft depth through blur and subtle shadow rather than hard borders. Dark mode is first-class. Motion is the product — spring-based, physical, continuous.

### Surfaces shipped in this system

- Desktop: Project board, Notes, Inbox, Command palette, Knowledge graph, Settings, Empty states
- Mobile: Inbox feed, Quick-capture, Note reader, Board view, Voice capture

### Bilingual / RTL

Atlas must handle **Hebrew and English** fluently — full RTL layout mirroring from the start. Typography is chosen to work in both scripts.

---

## Sources

This is a **greenfield** project. No codebase, Figma, or prior designs were provided. The direction established here is derived from:

- The written brief (reproduced in `brief.md` for reference).
- Named reference products: Linear, Things 3, Arc, Apple iOS/macOS 2025–26.
- Contemporary Apple HIG principles around motion, depth, and materials.

If you later have Figma files, a codebase, or existing screenshots for Atlas, attach them and re-run the system — it will get sharper with real context.

---

## Index

Root files:
- `README.md` — this file. Start here.
- `SKILL.md` — Agent-Skills-compatible manifest for Claude Code / other agents.
- `colors_and_type.css` — CSS variables for colors (light + dark) and typography.
- `motion.css` — Motion tokens (springs, durations, easing).
- `brief.md` — The original product brief, kept verbatim.

Folders:
- `fonts/` — Web fonts. Licensing notes inside.
- `assets/` — Logos, iconography, sample imagery.
- `preview/` — HTML cards that populate the Design System tab.
- `ui_kits/desktop/` — Desktop UI kit. See its README.
- `ui_kits/mobile/` — Mobile UI kit. See its README.

---

## CONTENT FUNDAMENTALS

Atlas is a private tool for two people. It should feel like a well-kept notebook — quiet, literate, never demanding. Copy is sparse and functional; the product doesn't need to sell itself.

### Voice

- **Direct, never cheerful.** We don't say "Woohoo!" or "Awesome!" — we say "Saved." or nothing at all.
- **Second person, singular.** "You" when we must, but most strings don't address the reader at all. Labels describe what they are, not what you should do: "Inbox" not "Your inbox," "New note" not "Create your first note."
- **No "we".** The app never speaks as a company. It is a tool, not a brand trying to befriend you.
- **Quiet confidence.** State facts. Don't apologize, don't exclaim.

### Casing

- **Sentence case everywhere.** Buttons, headers, menus, empty states, settings. "New project" — not "New Project" and never "NEW PROJECT."
- **Proper nouns retain capitalization.** "Atlas," "Apple," a person's name.
- **No all-caps microcopy.** Never use uppercase as a styling crutch.

### Punctuation

- **Periods in full sentences only.** Button labels, menu items, column titles have no trailing period.
- **Em-dashes over parentheses** when it feels literary — like this.
- **No exclamation marks.** Ever.
- **Smart quotes** (`'` `'` `"` `"`) in body copy where the stack supports them.

### Emoji

- **No emoji in UI chrome.** Not in buttons, menus, tooltips, empty states, or labels.
- **User content is sacred.** If a user types emoji in their notes, they render perfectly. The system itself abstains.

### Examples

| ❌ Avoid | ✅ Prefer |
|---|---|
| "🎉 Welcome to Atlas!" | "Atlas" |
| "You have 0 notes. Create your first one!" | "No notes yet." |
| "Are you sure you want to delete this?" | "Delete note?" |
| "Successfully saved!" | (silence — or a subtle check that fades) |
| "Oops! Something went wrong." | "Couldn't save. Try again." |
| "NEW PROJECT" | "New project" |
| "Click here to add a card" | "Add card" |
| "Your Inbox (3)" | "Inbox · 3" |

### Hebrew

- Hebrew copy follows the same principles: sentence case (where applicable — Hebrew has no case), no exclamation marks, quiet tone.
- Punctuation mirrors in RTL. Numbers remain LTR inline.
- Do not transliterate English product terms into Hebrew characters — use native Hebrew where available ("פרויקט" not "פרוג'קט"), English where it's a true proper noun ("Atlas").

---

## VISUAL FOUNDATIONS

The visual language is defined by three qualities: **restraint**, **depth**, and **warmth**.

### Color

Light mode is not pure white — it's a warm, slightly desaturated paper tone (`#FBFAF7`). Dark mode is not black — it's a cool graphite (`#0E1012`) with a hint of blue. Both modes share the same **ink** (primary foreground) principle: text is never pure black or pure white. Both use the same restrained accent palette.

- **One primary accent** — a deep, slightly muted indigo (`#4B5BE8` light / `#7B8AFF` dark). Used for selection, focus rings, primary actions, links. Never for decoration.
- **Semantic colors** — success (sage green), warning (amber), danger (persimmon). Muted, never saturated.
- **Surface tones** — three depth layers per mode. Not lines; tonal shifts.

Color is used like ink, not paint. Most of the interface is foreground/background/muted — accent is reserved for signal.

### Typography

Two families:

- **Display / UI: Inter Display** — for headings, labels, UI text. Crisp, optical-sized, designed for screens.
- **Reading / Body: Source Serif 4** — for note body text. Literary, warm, high-contrast. Notes should feel like reading a book.
- **Mono: JetBrains Mono** — for code blocks, IDs, keyboard shortcuts.
- **Hebrew: Heebo** (UI) and **Frank Ruhl Libre** (reading) — carefully paired with their Latin counterparts.

Type scale is generous. Base body is 15–16px. Note text is 17–18px with 1.6 line height. Headings have tighter line-height (1.1–1.2) and slightly negative letter-spacing at display sizes.

### Spacing

An 8px base grid, with 4px for tight UI. The scale is: 2, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Most layouts use a lot of the larger values — Atlas breathes.

### Backgrounds & surfaces

- **No full-bleed imagery** in chrome. The product is a workspace, not a marketing page.
- **No gradients as backgrounds.** A gradient exists only as a single brand mark (the Atlas "sphere" logo) and in the knowledge-graph visualization.
- **No patterns or textures** on primary surfaces. The warmth comes from the base tone, not ornament.
- **Optional photo wallpaper** in Settings — user-selectable, always behind a blur layer.

### Borders

Borders are used sparingly — only to separate content that truly needs separation (table rows, input fields at rest). They are always 1px, always in a near-surface tone (`--border-subtle`), never black or colored.

Most separation is done by:
1. **Elevation** — shadow + a half-step lighter/darker surface.
2. **Space** — letting components breathe apart.
3. **Soft blur** — on overlays and popovers.

### Shadows & elevation

Four elevation levels. Shadows are soft, long, and **cool-shifted** — they read as ambient light, not hard edges.

- `--shadow-1` — resting cards, subtle 1px ambient.
- `--shadow-2` — hover state, modest lift.
- `--shadow-3` — popovers, menus.
- `--shadow-4` — modals, sheets. Deep, diffuse, with a tight 1px rim light.

In dark mode shadows are still present but reduced — elevation is also carried by surface lightening.

### Corner radii

Soft, never pill-shaped. The radii feel sculpted:

- `--radius-xs` 4px — inputs, tags
- `--radius-sm` 8px — buttons, menu items
- `--radius-md` 12px — cards, panels
- `--radius-lg` 18px — modals, sheets
- `--radius-xl` 28px — major containers, the app window itself
- `--radius-full` 9999px — avatars only

Cards use `--radius-md` (12px) with `--shadow-1` at rest. On hover, they lift to `--shadow-2` with a subtle 1.5px translateY. No border.

### Transparency & blur

Used precisely, never decoratively:

- **Top bar and sidebar**: 70–80% opacity over content with `backdrop-filter: blur(24px) saturate(140%)`. Content scrolls *under* them.
- **Popovers, menus, command palette**: full-material blur (`blur(32px) saturate(180%)`) — Apple's "sidebar material" equivalent.
- **Modals**: solid surface with a scrim (40% black, no blur) over the dimmed background.
- **Never** blur the main content area, cards, or buttons themselves.

### Motion

Motion is the product. Three core springs, two durations for tween-only affordances:

```
--spring-gentle:  cubic-bezier(0.32, 0.72, 0, 1)           250ms   /* default UI */
--spring-snappy:  cubic-bezier(0.16, 1, 0.3, 1)            200ms   /* buttons, tabs */
--spring-drag:    real spring  stiffness 220  damping 26   /* dragged cards */
--ease-subtle:    cubic-bezier(0.4, 0, 0.2, 1)             120ms   /* hover color */
--ease-standard:  cubic-bezier(0.4, 0, 0.2, 1)             200ms   /* opacity fades */
```

Rules:
- **Everything moves.** Hover is a transition, not a jump. Panels slide open. Sheets spring up.
- **Drag has mass.** Cards follow the pointer with slight inertia. Drop-targets pulse gently.
- **Page transitions are continuous.** Route changes cross-fade with a 4–8px spatial slide in the direction of navigation.
- **No jarring snaps.** Even dismissals have a 120–160ms exit.
- **Reduced motion** is respected: springs become 80ms linear fades, drags still work but without follow-through.

### Interactive states

- **Hover** — opacity-free. Elements move to a one-step-lighter/darker surface tone (`--surface-hover`) with a 120ms ease. Accent elements deepen by ~6%.
- **Press** — a 96% scale transform with the spring-snappy curve; surface darkens by one more step. No color flashes.
- **Focus** — a 2px `--accent-primary` ring with 2px offset. Never removed; always respectful of keyboard users.
- **Disabled** — 40% opacity, cursor becomes default. No greying.
- **Loading** — skeleton shapes in the resting surface tone, with a 2000ms shimmer of `--surface-2`.

### Imagery

- Photography (rare): warm, natural light. No heavy filters. Slight grain acceptable. Never stock-photo glossy.
- Illustrations: avoided. Brand marks only.
- User-uploaded images in notes: clipped to `--radius-md`, no border, shadow-1 only if adjacent to text.

### Layout rules

- Desktop max content width for reading: 680px. Boards and lists are full-width within the content column.
- Sidebars: 260px collapsed, 320px expanded, resizable with a 240–400px clamp.
- Mobile: single-column, safe-area-respecting, bottom-sheet-first for actions.
- **Fixed elements**: top chrome (nav bar) and bottom chrome (mobile tab bar) only. Floating action buttons on mobile for quick-capture. No sticky side panels on mobile.

### Iconography

See **ICONOGRAPHY** below — summary: **Lucide** at 1.75px stroke, 20px default.

---

## ICONOGRAPHY

Atlas uses **Lucide icons** — an open-source icon set with a calm, uniform stroke style that matches Apple's SF Symbols language without copying it.

- **Stroke weight:** 1.75px (Lucide default is 2; we nudge down for a slightly lighter feel that matches our restrained aesthetic).
- **Default size:** 20px in UI; 16px in dense rows; 24px in empty states and hero moments.
- **Color:** `currentColor`. Icons inherit from their surrounding text. Active/selected states use `--accent-primary`.
- **Alignment:** optically aligned, not geometrically. Icons sit on the text baseline in labels.

### Sourcing

Lucide is loaded from CDN at `https://unpkg.com/lucide@latest/dist/umd/lucide.js` (or as inline SVG in JSX via `lucide-react` in real production). Offline copies of the handful we rely on most are in `assets/icons/` for fallback.

> **Substitution flag:** No custom icon set was provided. Lucide is our chosen match because its stroke style and geometry align with the Apple 2026 aesthetic anchor. If you have a proprietary icon set you'd like to use instead, drop it into `assets/icons/` and update this section.

### Unicode and emoji

- **No emoji in system UI.** Ever.
- **Unicode used sparingly:** `·` (middle dot) as a soft separator in metadata (e.g., "Inbox · 3"). `→` for nav hints. Math symbols only inside notes' own math blocks.
- **Keyboard shortcuts** render as small glyph chips: `⌘` `⇧` `⌥` `⌃` `↵` — these are Unicode, styled as mono-pill badges.

### The Atlas logomark

A single, soft gradient sphere — the only place in the product where a gradient lives. See `assets/logomark.svg`. The wordmark is set in Inter Display Semibold, tight tracking.

---

## Deliverables checklist

- [x] Direction pass (this README)
- [x] Typography system, spacing scale, color tokens (light + dark) — `colors_and_type.css`
- [x] Motion principles + specific spring values — `motion.css`
- [x] Hi-fi designs for key surfaces, desktop + mobile — `ui_kits/`
- [x] Motion spec for card drag, quick-capture, page transitions — see `ui_kits/desktop/index.html` interactions

## Caveats

- **Palette is now more vibrant** — indigo shifted from `#4B5BE8` → `#3D49F5` and an apricot secondary (`#FF8A3D`) was added for energy on status/tags.
- **Hebrew** now uses Heebo for UI (warmer, more modern than Noto Sans Hebrew) and keeps Frank Ruhl Libre for serif reading.
- **Motion prototype** (`motion_proto/index.html`) uses Framer Motion's real spring solver — drag a card, pull the bottom sheet, tap a note for shared-element transition.
- **Logomark, icons, fonts** still placeholder / CDN substitutions — swap when production assets arrive.
