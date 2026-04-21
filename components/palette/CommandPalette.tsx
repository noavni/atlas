"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { useUI } from "@/lib/store/ui";
import { useMe } from "@/lib/queries/me";
import { usePages } from "@/lib/queries/pages";
import { useSearch } from "@/lib/queries/search";
import { cn } from "@/lib/utils";

interface Entry {
  id: string;
  label: string;
  hint?: string;
  href: string;
}

function score(query: string, label: string): number {
  // Subsequence scoring: every query char must appear in order in label.
  // Shorter gaps and earlier matches score higher.
  const q = query.toLowerCase();
  const l = label.toLowerCase();
  let qi = 0;
  let last = -1;
  let s = 0;
  for (let li = 0; li < l.length && qi < q.length; li++) {
    if (l[li] === q[qi]) {
      s += 100 - Math.min(99, li - last);
      last = li;
      qi++;
    }
  }
  return qi === q.length ? s : -1;
}

export function CommandPalette() {
  const open = useUI((s) => s.commandPaletteOpen);
  const setOpen = useUI((s) => s.setCommandPaletteOpen);
  const [query, setQuery] = useState("");

  const me = useMe();
  const firstWorkspaceId = me.data?.workspaces[0]?.id;
  const pages = usePages(firstWorkspaceId);
  const serverSearch = useSearch(firstWorkspaceId, query);

  // ⌘K / Ctrl-K binding
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Reset query when closing
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const entries: Entry[] = useMemo(() => {
    const base: Entry[] = [
      { id: "go-inbox", label: "Go to Inbox", hint: "Navigate", href: "/inbox" },
      { id: "go-board", label: "Go to Boards", hint: "Navigate", href: "/board" },
      { id: "go-notes", label: "Go to Notes", hint: "Navigate", href: "/notes" },
      { id: "go-graph", label: "Go to Graph", hint: "Navigate", href: "/graph" },
      { id: "go-settings", label: "Go to Settings", hint: "Navigate", href: "/settings" },
    ];
    const pageEntries: Entry[] =
      pages.data?.map((p) => ({
        id: `page-${p.id}`,
        label: p.title,
        hint: "Note",
        href: `/notes/${encodeURIComponent(p.title)}`,
      })) ?? [];
    return [...pageEntries, ...base];
  }, [pages.data]);

  const ranked = useMemo(() => {
    if (!query) return entries.slice(0, 20);
    const local = entries
      .map((e) => ({ e, s: score(query, e.label) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.e);
    const server: Entry[] = (serverSearch.data ?? []).map((hit) => ({
      id: `srv-${hit.kind}-${hit.id}`,
      label: hit.title || hit.snippet.slice(0, 60) || "(untitled)",
      hint: hit.kind === "card" ? "Card" : hit.kind === "page" ? "Note" : "Inbox",
      href:
        hit.kind === "page"
          ? `/notes/${encodeURIComponent(hit.title)}`
          : hit.kind === "inbox"
          ? `/inbox`
          : `/board`,
    }));
    const dedup = new Map<string, Entry>();
    for (const e of [...local, ...server]) {
      if (!dedup.has(e.label.toLowerCase())) dedup.set(e.label.toLowerCase(), e);
    }
    return Array.from(dedup.values()).slice(0, 20);
  }, [entries, query, serverSearch.data]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            className={cn(
              "relative z-10 w-full max-w-[560px] overflow-hidden rounded-lg border border-border-subtle shadow-4",
            )}
            style={{
              background: "var(--material-thick)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
            }}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2 border-b border-border-subtle px-4 py-3">
              <Icon icon={Search} size={16} className="text-fg-3" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, jump anywhere…"
                className="flex-1 bg-transparent text-md text-fg-1 outline-none placeholder:text-fg-4"
              />
            </label>
            <ul className="max-h-[52vh] overflow-auto p-1.5">
              {ranked.length === 0 && (
                <li className="px-3 py-3 text-sm text-fg-3">No matches.</li>
              )}
              {ranked.map((e) => (
                <li key={e.id}>
                  <Link
                    href={e.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2 text-base",
                      "text-fg-1 transition-colors duration-100 hover:bg-surface-hover",
                    )}
                  >
                    <span className="truncate">{e.label}</span>
                    {e.hint && (
                      <span className="ms-auto text-xs text-fg-3">{e.hint}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
