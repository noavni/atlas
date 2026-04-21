# Atlas — Desktop UI kit

High-fidelity recreation of Atlas on desktop. Components are intentionally simple, mostly-cosmetic JSX — the goal is a pixel-accurate visual reference, not production code.

## Files

- `index.html` — interactive click-through of the desktop app
- `App.jsx` — shell (sidebar + main + optional right panel)
- `Sidebar.jsx` — collapsible sidebar with projects/notes navigation
- `Topbar.jsx` — translucent blurred top chrome
- `Board.jsx` — Kanban board with drag-to-reorder cards
- `Card.jsx` — kanban card (resting, hover, dragging)
- `NoteEditor.jsx` — block-based note editor (typography-forward)
- `Inbox.jsx` — brain dump feed
- `CommandPalette.jsx` — Raycast-style fuzzy search overlay
- `QuickCapture.jsx` — global capture overlay with voice
- `Graph.jsx` — knowledge graph visualization
- `Backlinks.jsx` — right-panel backlinks list
- `Settings.jsx` — preferences screen
- `Empty.jsx` — considered empty states
- `Icons.jsx` — inline Lucide SVGs

## Interactions demonstrated

- Press **⌘K** to open the command palette
- Press **⌘N** to trigger quick capture
- Switch views from the sidebar (Board, Notes, Inbox, Graph, Settings)
- Toggle light/dark from the top bar
- Toggle RTL (Hebrew) from the top bar
- Drag kanban cards between columns (cards have mass)
