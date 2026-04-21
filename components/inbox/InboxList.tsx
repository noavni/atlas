"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowRight,
  File as FileIcon,
  FileText,
  Globe,
  Image as ImageIcon,
  Mic,
  Trash2,
} from "lucide-react";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { SPRING } from "@/lib/motion";
import {
  useArchiveInbox,
  useConvertToNote,
  useInbox,
  useTrashInbox,
  type InboxItem,
  type InboxKind,
} from "@/lib/queries/inbox";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return "yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

const KIND_STYLES: Record<InboxKind, { bg: string; fg: string; icon: typeof Mic }> = {
  text: { bg: "bg-surface-2", fg: "text-fg-2", icon: FileText },
  voice: {
    bg: "bg-[var(--apricot-300)]",
    fg: "text-[var(--apricot-600)]",
    icon: Mic,
  },
  image: {
    bg: "bg-[var(--sage-100)]",
    fg: "text-[var(--sage-500)]",
    icon: ImageIcon,
  },
  url: { bg: "bg-accent-tint", fg: "text-accent", icon: Globe },
  file: {
    bg: "bg-[var(--amber-100)]",
    fg: "text-[var(--amber-500)]",
    icon: FileIcon,
  },
};

export function InboxList({ workspaceId }: { workspaceId: string | undefined }) {
  const { data, isLoading } = useInbox(workspaceId);
  const toNote = useConvertToNote();
  const archive = useArchiveInbox();
  const trash = useTrashInbox();

  if (!workspaceId) return null;
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-md bg-surface-2" />
        ))}
      </div>
    );
  }
  if (!data || data.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {data.map((item) => {
          const style = KIND_STYLES[item.kind];
          return (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={SPRING.gentle}
              className={cn(
                "group flex items-start gap-3 rounded-md border border-border-subtle bg-surface-raised px-4 py-3 shadow-1",
                "transition-[transform,box-shadow] duration-150 hover:shadow-2",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-sm",
                  style.bg,
                  style.fg,
                )}
              >
                <Icon icon={style.icon} size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 text-[11px] text-fg-3">
                  {formatWhen(item.captured_at)}
                </div>
                <Preview item={item} />
              </div>
              <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => toNote.mutate({ itemId: item.id, workspaceId })}
                  className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-[11.5px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
                >
                  Note
                </button>
                <button
                  type="button"
                  onClick={() => archive.mutate({ itemId: item.id, workspaceId })}
                  className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-[11.5px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
                >
                  <span className="inline-flex items-center gap-1">
                    <Icon icon={Archive} size={11} />
                    Archive
                  </span>
                </button>
                <IconButton
                  size="sm"
                  title="Trash"
                  onClick={() => trash.mutate({ itemId: item.id, workspaceId })}
                >
                  <Icon icon={Trash2} size={14} />
                </IconButton>
                <IconButton size="sm" title="Open">
                  <Icon icon={ArrowRight} size={14} />
                </IconButton>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function Preview({ item }: { item: InboxItem }) {
  if (item.transcript) {
    return (
      <div className="line-clamp-3 font-serif text-[15px] leading-[1.5] text-fg-1">
        {item.transcript}
      </div>
    );
  }
  if (item.raw_text) {
    return (
      <div className="line-clamp-3 font-serif text-[15px] leading-[1.5] text-fg-1">
        {item.raw_text}
      </div>
    );
  }
  return <div className="text-sm italic text-fg-3">Untitled capture</div>;
}
