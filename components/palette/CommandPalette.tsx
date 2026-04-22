"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  FileText,
  Inbox,
  LayoutGrid,
  NotebookPen,
  Network,
  Plus,
  Search,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { Kbd } from "@/components/primitives/Kbd";
import { SPRING } from "@/lib/motion";
import { useMe } from "@/lib/queries/me";
import { useLeads } from "@/lib/queries/leads";
import { usePages } from "@/lib/queries/pages";
import { useSearch } from "@/lib/queries/search";
import { useLeadsUI } from "@/lib/store/leads";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Entry = {
  id: string;
  label: string;
  icon: LucideIcon;
  section: "Suggested" | "Navigate" | "Actions";
  shortcut?: string[];
  run: () => void;
};

function score(q: string, label: string): number {
  if (!q) return 0;
  const ql = q.toLowerCase();
  const ll = label.toLowerCase();
  let qi = 0;
  let last = -1;
  let s = 0;
  for (let i = 0; i < ll.length && qi < ql.length; i++) {
    if (ll[i] === ql[qi]) {
      s += 100 - Math.min(99, i - last);
      last = i;
      qi++;
    }
  }
  return qi === ql.length ? s : -1;
}

export function CommandPalette() {
  const open = useUI((s) => s.commandPaletteOpen);
  const setOpen = useUI((s) => s.setCommandPaletteOpen);
  const setQuickCaptureOpen = useUI((s) => s.setQuickCaptureOpen);
  const setNewLeadOpen = useLeadsUI((s) => s.setNewLeadOpen);
  const openLeadDrawer = useLeadsUI((s) => s.openLeadDrawer);

  const router = useRouter();
  const me = useMe();
  const ws = me.data?.workspaces[0]?.id;
  const pages = usePages(ws);
  const leads = useLeads(ws);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const serverSearch = useSearch(ws, query);
  const listRef = useRef<HTMLUListElement>(null);

  // Global shortcuts — always active
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      if (meta && !e.shiftKey && k === "k") {
        e.preventDefault();
        setOpen(!open);
        return;
      }
      if (meta && e.shiftKey && k === "n") {
        e.preventDefault();
        router.push("/notes");
        return;
      }
      if (meta && !e.shiftKey) {
        if (k === "1") { e.preventDefault(); router.push("/inbox"); return; }
        if (k === "2") { e.preventDefault(); router.push("/notes"); return; }
        if (k === "3") { e.preventDefault(); router.push("/leads"); return; }
        if (k === "4") { e.preventDefault(); router.push("/graph"); return; }
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen, router]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSel(0);
    }
  }, [open]);

  const entries: Entry[] = useMemo(() => {
    const nav: Entry[] = [
      { id: "go-inbox", label: "Go to Inbox", icon: Inbox, section: "Navigate", shortcut: ["⌘", "1"], run: () => router.push("/inbox") },
      { id: "go-notes", label: "Go to Notes", icon: NotebookPen, section: "Navigate", shortcut: ["⌘", "2"], run: () => router.push("/notes") },
      { id: "go-leads", label: "Go to Leads", icon: Users, section: "Navigate", shortcut: ["⌘", "3"], run: () => router.push("/leads") },
      { id: "go-graph", label: "Go to Graph", icon: Network, section: "Navigate", shortcut: ["⌘", "4"], run: () => router.push("/graph") },
      { id: "go-settings", label: "Go to Settings", icon: Settings, section: "Navigate", run: () => router.push("/settings") },
    ];
    const actions: Entry[] = [
      { id: "a-new-note", label: "New note", icon: NotebookPen, section: "Actions", shortcut: ["⌘", "⇧", "N"], run: () => router.push("/notes") },
      { id: "a-new-lead", label: "New lead", icon: Users, section: "Actions", shortcut: ["⌘", "⇧", "L"], run: () => setNewLeadOpen(true) },
      { id: "a-quick", label: "Quick capture", icon: Plus, section: "Actions", shortcut: ["⌘", "N"], run: () => setQuickCaptureOpen(true) },
    ];
    const suggested: Entry[] = [];
    for (const l of (leads.data ?? []).slice(0, 6)) {
      suggested.push({
        id: `lead-${l.id}`,
        label: `${l.name}${l.company ? ` — ${l.company}` : ""}`,
        icon: Users,
        section: "Suggested",
        run: () => openLeadDrawer(l.id),
      });
    }
    for (const p of (pages.data ?? []).slice(0, 6)) {
      suggested.push({
        id: `page-${p.id}`,
        label: p.title,
        icon: FileText,
        section: "Suggested",
        run: () => router.push(`/notes/${encodeURIComponent(p.title)}`),
      });
    }
    return [...suggested, ...nav, ...actions];
  }, [leads.data, pages.data, router, setNewLeadOpen, setQuickCaptureOpen, openLeadDrawer]);

  const ranked = useMemo(() => {
    if (!query) return entries;
    const scored = entries
      .map((e) => ({ e, s: score(query, e.label) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.e);
    const srv: Entry[] = (serverSearch.data ?? []).slice(0, 5).map((h) => ({
      id: `srv-${h.kind}-${h.id}`,
      label: h.title || h.snippet.slice(0, 60),
      icon: h.kind === "page" ? FileText : h.kind === "card" ? LayoutGrid : Sparkles,
      section: "Suggested" as const,
      run: () => {
        if (h.kind === "page") router.push(`/notes/${encodeURIComponent(h.title)}`);
        else if (h.kind === "card") router.push("/board");
        else router.push("/inbox");
      },
    }));
    const dedup = new Map<string, Entry>();
    for (const e of [...scored, ...srv]) {
      if (!dedup.has(e.label.toLowerCase())) dedup.set(e.label.toLowerCase(), e);
    }
    return Array.from(dedup.values()).slice(0, 20);
  }, [entries, query, serverSearch.data, router]);

  useEffect(() => setSel(0), [query, ranked.length]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function runEntry(e: Entry) {
    e.run();
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(ranked.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      const target = ranked[sel];
      if (target) runEntry(target);
    }
  }

  const grouped = useMemo(() => {
    const order = ["Suggested", "Navigate", "Actions"] as const;
    const out = new Map<string, Entry[]>();
    for (const e of ranked) {
      const arr = out.get(e.section) ?? [];
      arr.push(e);
      out.set(e.section, arr);
    }
    return order
      .filter((k) => out.has(k))
      .map((k) => [k, out.get(k)!] as const);
  }, [ranked]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            className="relative z-10 w-full max-w-[560px] overflow-hidden rounded-2xl border border-border-subtle shadow-4"
            style={{
              background: "var(--material-thick)",
              backdropFilter: "blur(32px) saturate(180%)",
              WebkitBackdropFilter: "blur(32px) saturate(180%)",
            }}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={SPRING.panel}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border-subtle px-[18px] py-3.5">
              <Icon icon={Search} size={16} className="text-fg-3" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search anything, jump anywhere…"
                className="flex-1 bg-transparent text-[15px] text-fg-1 outline-none placeholder:text-fg-4"
              />
              <Kbd>Esc</Kbd>
            </div>
            <ul ref={listRef} className="max-h-[52vh] overflow-auto p-1.5">
              {grouped.length === 0 && (
                <li className="px-3 py-3 text-sm text-fg-3">No matches.</li>
              )}
              {grouped.map(([section, items], sIdx) => (
                <div key={section}>
                  <div className="px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                    {section}
                  </div>
                  {items.map((e) => {
                    const globalIdx = ranked.indexOf(e);
                    const isSel = globalIdx === sel;
                    return (
                      <li key={e.id} data-idx={globalIdx}>
                        <button
                          type="button"
                          onMouseEnter={() => setSel(globalIdx)}
                          onClick={() => runEntry(e)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-md px-3 py-2 text-start",
                            isSel
                              ? "bg-accent-tint text-fg-1 [&_svg]:text-accent"
                              : "text-fg-1 hover:bg-surface-hover",
                          )}
                        >
                          <Icon icon={e.icon} size={14} className="text-fg-3" />
                          <span className="flex-1 truncate text-[13.5px]">{e.label}</span>
                          {e.shortcut && (
                            <span className="flex items-center gap-1">
                              {e.shortcut.map((k, i) => (
                                <Kbd key={i}>{k}</Kbd>
                              ))}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {sIdx < grouped.length - 1 && <div className="my-1.5 h-px bg-border-subtle" />}
                </div>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
