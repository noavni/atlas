"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, FileText, Mic, Trash2 } from "lucide-react";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import {
  useArchiveInbox,
  useConvertToNote,
  useInbox,
  useTrashInbox,
  type InboxItem,
} from "@/lib/queries/inbox";
import { cn } from "@/lib/utils";

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

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
        {data.map((item) => (
          <motion.li
            key={item.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className={cn(
              "group flex items-start gap-3 rounded-md border border-border-subtle bg-surface-raised p-3 shadow-1",
              "transition-[transform,box-shadow] duration-150 hover:shadow-2",
            )}
          >
            <div
              className={cn(
                "mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-sm",
                item.kind === "voice" ? "bg-apricot-300 text-apricot-600" : "bg-surface-2 text-fg-2",
              )}
            >
              <Icon icon={item.kind === "voice" ? Mic : FileText} size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <Preview item={item} />
              <div className="mt-1 text-[11px] text-fg-3">{formatWhen(item.captured_at)}</div>
            </div>
            <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <IconButton
                size="sm"
                title="Convert to note"
                onClick={() => toNote.mutate({ itemId: item.id, workspaceId })}
              >
                <Icon icon={FileText} size={14} />
              </IconButton>
              <IconButton
                size="sm"
                title="Archive"
                onClick={() => archive.mutate({ itemId: item.id, workspaceId })}
              >
                <Icon icon={Archive} size={14} />
              </IconButton>
              <IconButton
                size="sm"
                title="Trash"
                onClick={() => trash.mutate({ itemId: item.id, workspaceId })}
              >
                <Icon icon={Trash2} size={14} />
              </IconButton>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function Preview({ item }: { item: InboxItem }) {
  if (item.transcript) {
    return <div className="line-clamp-3 text-sm text-fg-1">{item.transcript}</div>;
  }
  if (item.raw_text) {
    return <div className="line-clamp-3 text-sm text-fg-1">{item.raw_text}</div>;
  }
  return <div className="text-sm italic text-fg-3">Untitled capture</div>;
}
