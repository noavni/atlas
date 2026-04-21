"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { Lead } from "@/lib/types";

export interface MentionItem {
  id: string;
  label: string;
  company?: string | null;
  stage: Lead["stage"];
  avatar_color: string;
}

export interface MentionListHandle {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

interface Props {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
}

export const MentionList = forwardRef<MentionListHandle, Props>(function MentionList(
  { items, command },
  ref,
) {
  const [selected, setSelected] = useState(0);

  useEffect(() => setSelected(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "ArrowUp") {
        setSelected((i) => (i - 1 + items.length) % Math.max(1, items.length));
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelected((i) => (i + 1) % Math.max(1, items.length));
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = items[selected];
        if (item) {
          command({ id: item.id, label: item.label });
          return true;
        }
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="min-w-[240px] rounded-xl border border-border-subtle bg-surface-raised p-3 text-[12.5px] text-fg-3 shadow-3">
        No matching leads.
      </div>
    );
  }

  return (
    <div className="max-h-[260px] min-w-[260px] overflow-y-auto rounded-xl border border-border-subtle bg-surface-raised p-1.5 shadow-3">
      {items.map((item, i) => {
        const isSel = i === selected;
        return (
          <button
            key={item.id}
            type="button"
            onMouseEnter={() => setSelected(i)}
            onClick={() => command({ id: item.id, label: item.label })}
            className={
              "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-start transition-colors " +
              (isSel ? "bg-accent-tint text-fg-1" : "text-fg-1 hover:bg-surface-hover")
            }
          >
            <span
              className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-[10px] font-semibold text-white shadow-1"
              style={{ background: item.avatar_color }}
              aria-hidden="true"
            >
              {item.label
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium">{item.label}</span>
              {item.company && (
                <span className="block truncate text-[11px] text-fg-3">{item.company}</span>
              )}
            </span>
            <span className="rounded-xs bg-surface-2 px-1.5 py-px text-[10px] font-medium text-fg-3">
              {item.stage}
            </span>
          </button>
        );
      })}
    </div>
  );
});
