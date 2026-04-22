"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
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

  const pluralThings = filtered.length === 1 ? "thing" : "things";

  return (
    <AppShell crumbs={["Atlas", "Inbox"]}>
      <div className="mx-auto max-w-[740px] px-10 pb-20 pt-10">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-fg-1">
              Inbox
            </h1>
            <p className="mt-1 text-[13px] text-fg-3">
              {filtered.length === 0
                ? "Empty — capture with ⌘N anywhere."
                : `${filtered.length} ${pluralThings} to organize. No hurry.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuickCaptureOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3 font-ui text-[12px] font-medium text-fg-on-accent shadow-1 transition-opacity hover:opacity-90"
          >
            <Icon icon={Sparkles} size={12} />
            <span>Capture</span>
            <Kbd className="bg-white/20 text-fg-on-accent">⌘N</Kbd>
          </button>
        </div>

        <div className="mb-5 inline-flex h-7 items-center gap-0.5 rounded-[8px] border border-border-subtle bg-surface-2 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-[6px] px-2.5 py-[3px] text-[11.5px] font-medium transition-colors",
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
                className="h-16 animate-pulse rounded-[14px] border border-border-subtle bg-surface-raised"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-[18px] border border-dashed border-border-subtle bg-surface-raised/60 px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent">
              <Icon icon={Inbox} size={24} />
            </div>
            <div className="font-display text-[18px] font-semibold text-fg-1">
              Nothing here yet
            </div>
            <div className="mt-1 max-w-[320px] text-[13px] text-fg-3">
              Drop a thought, a voice memo, a link, anything. We'll help you sort it later.
            </div>
            <button
              type="button"
              onClick={() => setQuickCaptureOpen(true)}
              className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-medium text-fg-on-accent shadow-1 transition-opacity hover:opacity-90"
            >
              <Icon icon={Sparkles} size={13} />
              Capture something
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-7">
            {groups.map(([day, items]) => (
              <section key={day}>
                <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
                  {day}
                </div>
                <ul className="flex flex-col gap-1.5">
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
                          className="group relative flex items-start gap-3 rounded-[14px] border border-border-subtle bg-surface-raised px-4 py-3 transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-[1px] hover:border-border-strong hover:shadow-2"
                        >
                          <div
                            className={cn(
                              "mt-[3px] flex h-7 w-7 flex-none items-center justify-center rounded-[8px]",
                              k.bg,
                              k.fg,
                            )}
                          >
                            <Icon icon={k.icon} size={13} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              dir="auto"
                              className="truncate font-serif text-[16px] leading-[1.45] text-fg-1"
                            >
                              {item.transcript || item.raw_text || (
                                <em className="text-fg-3">Untitled</em>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-fg-3">
                              <span className="capitalize">{k.label}</span>
                              <span className="text-fg-4">·</span>
                              <span>{timeOnly(item.captured_at)}</span>
                            </div>
                          </div>
                          <div className="absolute end-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 rounded-full border border-border-subtle bg-surface-raised p-0.5 opacity-0 shadow-2 transition-opacity duration-150 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() =>
                                toNote.mutate({
                                  itemId: item.id,
                                  workspaceId: workspaceId!,
                                })
                              }
                              className="rounded-full px-2.5 py-1 text-[11px] font-medium text-fg-1 transition-colors hover:bg-surface-2"
                            >
                              → Note
                            </button>
                            <IconButton
                              size="sm"
                              title="Archive"
                              onClick={() =>
                                archive.mutate({
                                  itemId: item.id,
                                  workspaceId: workspaceId!,
                                })
                              }
                            >
                              <Icon icon={Archive} size={12} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              title="Trash"
                              onClick={() =>
                                trash.mutate({
                                  itemId: item.id,
                                  workspaceId: workspaceId!,
                                })
                              }
                            >
                              <Icon icon={Trash2} size={12} />
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
