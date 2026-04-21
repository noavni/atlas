"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  File as FileIcon,
  FileText,
  Globe,
  Image as ImageIcon,
  Inbox,
  Mic,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { Kbd } from "@/components/primitives/Kbd";
import { SPRING } from "@/lib/motion";
import { useMe } from "@/lib/queries/me";
import {
  useArchiveInbox,
  useConvertToNote,
  useInbox,
  useTrashInbox,
  type InboxItem,
  type InboxKind,
} from "@/lib/queries/inbox";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "text" | "voice" | "url" | "file" | "image";

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "text", label: "Text" },
  { id: "voice", label: "Voice" },
  { id: "url", label: "Links" },
  { id: "file", label: "Files" },
];

const KIND: Record<InboxKind, { bg: string; fg: string; icon: typeof Mic; label: string }> = {
  text: { bg: "bg-surface-2", fg: "text-fg-2", icon: FileText, label: "typed" },
  voice: {
    bg: "bg-[var(--apricot-300)]",
    fg: "text-[var(--apricot-600)]",
    icon: Mic,
    label: "voice",
  },
  image: {
    bg: "bg-[var(--sage-100)]",
    fg: "text-[var(--sage-500)]",
    icon: ImageIcon,
    label: "image",
  },
  url: { bg: "bg-accent-tint", fg: "text-accent", icon: Globe, label: "link" },
  file: {
    bg: "bg-[var(--amber-100)]",
    fg: "text-[var(--amber-500)]",
    icon: FileIcon,
    label: "file",
  },
};

function dayBucket(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function InboxPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const inbox = useInbox(workspaceId);
  const setQuickCaptureOpen = useUI((s) => s.setQuickCaptureOpen);
  const [filter, setFilter] = useState<FilterKey>("all");
  const archive = useArchiveInbox();
  const trash = useTrashInbox();
  const toNote = useConvertToNote();

  const filtered = useMemo(() => {
    const items = inbox.data ?? [];
    if (filter === "all") return items;
    return items.filter((i) => i.kind === filter);
  }, [inbox.data, filter]);

  const groups = useMemo(() => {
    const out = new Map<string, InboxItem[]>();
    for (const item of filtered) {
      const key = dayBucket(item.captured_at);
      (out.get(key) ?? out.set(key, []).get(key)!).push(item);
    }
    return Array.from(out.entries());
  }, [filtered]);

  return (
    <AppShell crumbs={["Atlas", "Inbox"]}>
      <div className="mx-auto max-w-[760px] px-10 pb-20 pt-9">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
              Tuesday · inbox
            </div>
            <h1 className="m-0 font-display text-[36px] font-semibold leading-[1.05] tracking-[-0.018em] text-fg-1">
              Brain dump
            </h1>
            <p className="mt-1.5 text-[13px] text-fg-3">
              {filtered.length === 0
                ? "Empty. Press ⌘N to drop something in."
                : `${filtered.length} ${filtered.length === 1 ? "thing" : "things"} to organize. No hurry.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuickCaptureOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3.5 font-ui text-[12.5px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
          >
            <Icon icon={Sparkles} size={14} />
            <span>Quick capture</span>
            <Kbd>⌘N</Kbd>
          </button>
        </div>

        <div className="mb-5 inline-flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-2 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                filter === f.id
                  ? "bg-surface-raised text-fg-1 shadow-1"
                  : "text-fg-2 hover:text-fg-1",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {inbox.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-border-subtle bg-surface-raised"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Inbox} size={28} />}
            title="No captures here."
            hint="Press ⌘N anywhere to drop a quick note, voice memo, or link."
          />
        ) : (
          <div className="flex flex-col gap-8">
            {groups.map(([day, items]) => (
              <section key={day}>
                <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  {day}
                </div>
                <ul className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {items.map((item) => {
                      const k = KIND[item.kind];
                      return (
                        <motion.li
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          transition={SPRING.gentle}
                          className="group relative flex items-start gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3.5 shadow-1 transition-[transform,box-shadow] duration-150 hover:-translate-y-[1px] hover:shadow-2"
                        >
                          <div
                            className={cn(
                              "mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg",
                              k.bg,
                              k.fg,
                            )}
                          >
                            <Icon icon={k.icon} size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-[11px] text-fg-3">
                              <span>{timeOnly(item.captured_at)}</span>
                              <span className="text-fg-4">·</span>
                              <span>{k.label}</span>
                            </div>
                            <div className="mt-1 font-serif text-[16px] leading-[1.5] text-fg-1">
                              {item.transcript || item.raw_text || <em className="text-fg-3">Untitled</em>}
                            </div>
                          </div>
                          <div className="absolute end-3 top-2.5 inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-surface-raised p-0.5 opacity-0 shadow-2 transition-opacity duration-150 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => toNote.mutate({ itemId: item.id, workspaceId: workspaceId! })}
                              className="rounded-md px-2.5 py-1 text-[11.5px] font-medium text-fg-1 transition-colors hover:bg-surface-2"
                            >
                              Note
                            </button>
                            <IconButton
                              size="sm"
                              title="Archive"
                              onClick={() => archive.mutate({ itemId: item.id, workspaceId: workspaceId! })}
                            >
                              <Icon icon={Archive} size={13} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              title="Trash"
                              onClick={() => trash.mutate({ itemId: item.id, workspaceId: workspaceId! })}
                            >
                              <Icon icon={Trash2} size={13} />
                            </IconButton>
                            <IconButton size="sm" title="Open">
                              <Icon icon={ArrowRight} size={13} />
                            </IconButton>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
