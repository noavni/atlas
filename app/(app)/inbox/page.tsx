"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  Archive,
  File as FileIcon,
  FileText,
  Globe,
  Image as ImageIcon,
  Inbox,
  Mic,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { Kbd } from "@/components/primitives/Kbd";
import { SPRING } from "@/lib/motion";
import { useMe } from "@/lib/queries/me";
import {
  useArchiveInbox,
  useCapture,
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

const KIND: Record<
  InboxKind,
  { bg: string; fg: string; icon: typeof Mic; label: string }
> = {
  text: { bg: "bg-surface-2", fg: "text-fg-2", icon: Plus, label: "typed" },
  voice: {
    bg: "bg-[var(--apricot-100,var(--apricot-300))]",
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
  url: { bg: "bg-surface-2", fg: "text-fg-2", icon: Globe, label: "link" },
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

function relativeLabel(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days <= 0) return timeOnly(iso);
  if (days === 1) return "yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" }).toLowerCase();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function extractUrl(text: string): string | null {
  const m = text?.match(/https?:\/\/[^\s]+/i);
  return m ? m[0] : null;
}

function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function InboxPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const inbox = useInbox(workspaceId);
  const setQuickCaptureOpen = useUI((s) => s.setQuickCaptureOpen);
  const capture = useCapture();
  const [filter, setFilter] = useState<FilterKey>("all");
  const archive = useArchiveInbox();
  const trash = useTrashInbox();
  const toNote = useConvertToNote();

  const [draft, setDraft] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = draftRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }, [draft]);

  async function submitDraft() {
    if (!workspaceId || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await capture.mutateAsync({ workspaceId, kind: "text", raw_text: text });
  }

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
      <div className="mx-auto w-full max-w-[760px] px-10 pb-24 pt-10">
        {/* Hero */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 text-[11.5px] font-medium lowercase tracking-[0.01em] text-fg-3">
              today · inbox
            </div>
            <h1 className="m-0 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.022em] text-fg-1">
              Brain dump
            </h1>
            <p className="mt-1 text-[13px] text-fg-3">
              {filtered.length === 0
                ? "Empty — press ⌘N to drop something in."
                : `${filtered.length} ${pluralThings} to organize. No hurry.`}
            </p>
          </div>
          <button
            type="button"
            title="Auto-organize (soon)"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3 text-[12px] font-medium text-fg-2 shadow-1 transition-colors hover:bg-surface-2 hover:text-fg-1"
          >
            <Icon icon={Sparkles} size={12} className="text-accent" />
            Auto-organize
          </button>
        </div>

        {/* Inline capture bar — matches QuickCapture look */}
        <div
          className={cn(
            "atlas-inline-capture",
            "mb-6 overflow-hidden rounded-[var(--radius-lg)] bg-surface-raised",
            "shadow-[0_0_0_0.5px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)]",
            "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.05)]",
          )}
        >
          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.metaKey &&
                !e.ctrlKey &&
                !draft.includes("\n")
              ) {
                e.preventDefault();
                void submitDraft();
              }
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submitDraft();
              }
            }}
            placeholder="What's on your mind…"
            rows={1}
            dir="auto"
            className="w-full resize-none bg-transparent px-6 pb-4 pt-5 font-serif text-[17px] leading-[1.5] text-fg-1 outline-none placeholder:text-fg-4"
            style={{ minHeight: 60 }}
          />
          <div className="flex items-center gap-1.5 border-t border-border-subtle/70 px-5 py-3.5">
            <IconButton
              size="sm"
              title="Record voice (opens quick capture)"
              onClick={() => setQuickCaptureOpen(true)}
            >
              <Icon icon={Mic} size={15} />
            </IconButton>
            <IconButton size="sm" title="Image (soon)" disabled>
              <Icon icon={ImageIcon} size={15} />
            </IconButton>
            <IconButton size="sm" title="File (soon)" disabled>
              <Icon icon={FileIcon} size={15} />
            </IconButton>
            <div className="ms-auto flex items-center gap-1.5">
              {draft.trim() ? (
                <button
                  type="button"
                  onClick={submitDraft}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[12.5px] font-medium text-fg-on-accent shadow-1 transition-opacity hover:opacity-90"
                >
                  Save
                  <Kbd className="bg-white/20 text-fg-on-accent">↵</Kbd>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuickCaptureOpen(true)}
                  className="inline-flex h-8 items-center gap-1 rounded-full border border-border-subtle bg-surface-1 px-3 text-[11.5px] font-medium text-fg-3 transition-colors hover:bg-surface-2 hover:text-fg-1"
                  title="Open quick capture"
                >
                  <Kbd>⌘N</Kbd>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter tabs — subtle */}
        {filtered.length > 0 && (
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
        )}

        {inbox.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-[14px] bg-surface-2/60"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <EmptyHero onCapture={() => setQuickCaptureOpen(true)} />
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map(([day, items]) => (
              <section key={day}>
                <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
                  {day}
                </div>
                <ul className="flex flex-col gap-1">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <InboxRow
                        key={item.id}
                        item={item}
                        onNote={() =>
                          workspaceId && toNote.mutate({ itemId: item.id, workspaceId })
                        }
                        onArchive={() =>
                          workspaceId && archive.mutate({ itemId: item.id, workspaceId })
                        }
                        onTrash={() =>
                          workspaceId && trash.mutate({ itemId: item.id, workspaceId })
                        }
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Floating FAB — shortcut to Quick capture */}
      <button
        type="button"
        onClick={() => setQuickCaptureOpen(true)}
        className="fixed bottom-20 end-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-fg-on-accent shadow-[0_12px_24px_-6px_color-mix(in_oklch,var(--accent-primary)_55%,transparent)] transition-transform hover:scale-105 active:scale-95"
        title="Quick capture — ⌘N"
      >
        <Icon icon={Plus} size={18} />
      </button>
    </AppShell>
  );
}

function InboxRow({
  item,
  onNote,
  onArchive,
  onTrash,
}: {
  item: InboxItem;
  onNote: () => void;
  onArchive: () => void;
  onTrash: () => void;
}) {
  const k = KIND[item.kind];
  const body = item.transcript || item.raw_text || "";
  const url = item.kind === "url" ? extractUrl(body) : null;
  const domain = url ? extractDomain(url) : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={SPRING.gentle}
      className={cn(
        "group relative flex items-start gap-3 rounded-[14px] px-3 py-2.5 transition-colors duration-150",
        "hover:bg-surface-raised",
      )}
    >
      <div
        className={cn(
          "mt-[2px] flex h-8 w-8 flex-none items-center justify-center rounded-full",
          k.bg,
          k.fg,
        )}
      >
        <Icon icon={k.icon} size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-[11px] text-fg-3">
          <span>{relativeLabel(item.captured_at)}</span>
        </div>
        {item.kind === "voice" ? (
          <VoiceBody item={item} />
        ) : item.kind === "url" ? (
          <UrlBody body={body} domain={domain} url={url} />
        ) : item.kind === "image" ? (
          <ImageBody body={body} />
        ) : (
          <div
            dir="auto"
            className="mt-0.5 line-clamp-2 whitespace-pre-line break-words font-serif text-[15px] leading-[1.45] text-fg-1"
          >
            {body || <em className="text-fg-3">Untitled</em>}
          </div>
        )}
      </div>

      {/* Hover action pills */}
      <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <button
          type="button"
          onClick={onNote}
          className="inline-flex h-7 items-center rounded-full border border-border-subtle bg-surface-raised px-2.5 text-[11px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
        >
          Note
        </button>
        <button
          type="button"
          className="inline-flex h-7 items-center rounded-full border border-border-subtle bg-surface-raised px-2.5 text-[11px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
          title="Task (soon)"
        >
          Task
        </button>
        <IconButton size="sm" title="Archive" onClick={onArchive}>
          <Icon icon={Archive} size={12} />
        </IconButton>
        <IconButton size="sm" title="Trash" onClick={onTrash}>
          <Icon icon={Trash2} size={12} />
        </IconButton>
      </div>
    </motion.li>
  );
}

function VoiceBody({ item }: { item: InboxItem }) {
  // Attachments jsonb may carry {size_kb, duration_s, ...}
  const atts = (item.attachments ?? []) as Array<{
    duration_s?: number;
    size_kb?: number;
  }>;
  const durationS = atts[0]?.duration_s;
  const duration = durationS ? formatDuration(durationS) : null;
  const transcript = item.transcript?.trim();
  return (
    <div
      dir="auto"
      className="mt-0.5 line-clamp-2 font-serif text-[15px] leading-[1.45] text-fg-1"
    >
      {duration && (
        <span className="me-1.5 font-mono text-[12px] font-medium text-fg-3">
          {duration}
        </span>
      )}
      {transcript ? (
        <span>“{transcript}”</span>
      ) : (
        <em className="text-fg-3">Voice memo — transcribing…</em>
      )}
    </div>
  );
}

function UrlBody({
  body,
  domain,
  url,
}: {
  body: string;
  domain: string | null;
  url: string | null;
}) {
  const title = body.replace(url ?? "", "").trim();
  return (
    <>
      <div className="mt-0.5 flex items-center gap-1.5 font-serif text-[15px] leading-[1.35] text-fg-1">
        {domain && <span className="font-ui text-fg-2">{domain}</span>}
        {domain && title && <span className="text-fg-4">·</span>}
        {title && (
          <span dir="auto" className="truncate">
            {title}
          </span>
        )}
        {!title && !domain && (
          <span className="truncate">{body}</span>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="ms-1 text-fg-3 hover:text-accent"
            onClick={(e) => e.stopPropagation()}
          >
            <Icon icon={ArrowUpRight} size={12} />
          </a>
        )}
      </div>
    </>
  );
}

function ImageBody({ body }: { body: string }) {
  return (
    <div className="mt-1">
      <div className="h-[92px] w-[160px] rounded-[10px] bg-[linear-gradient(135deg,var(--sage-100),var(--amber-100))] shadow-1" />
      <div
        dir="auto"
        className="mt-2 truncate font-ui text-[13px] font-medium text-fg-1"
      >
        {body || "Image"}
      </div>
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function EmptyHero({ onCapture }: { onCapture: () => void }) {
  return (
    <div className="mt-8 flex flex-col items-center rounded-[18px] border border-dashed border-border-subtle bg-surface-raised/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-tint text-accent">
        <Icon icon={Inbox} size={24} />
      </div>
      <div className="font-display text-[18px] font-semibold text-fg-1">
        Nothing here yet
      </div>
      <div className="mt-1 max-w-[320px] text-[13px] text-fg-3">
        A thought, a voice memo, a link — drop it in and sort it later.
      </div>
      <button
        type="button"
        onClick={onCapture}
        className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-[12.5px] font-medium text-fg-on-accent shadow-1 transition-opacity hover:opacity-90"
      >
        <Icon icon={Sparkles} size={13} />
        Capture something
      </button>
    </div>
  );
}
