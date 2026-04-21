"use client";

import Link from "next/link";
import { Network } from "lucide-react";
import { Icon } from "@/components/primitives/Icon";
import { useBacklinks } from "@/lib/queries/pages";

export function BacklinksPanel({ pageId }: { pageId: string }) {
  const { data, isLoading } = useBacklinks(pageId);
  return (
    <aside className="mt-9 border-t border-border-subtle pt-5">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
        <Icon icon={Network} size={12} />
        <span>Backlinks</span>
        {data && <span>· {data.length}</span>}
      </div>
      {isLoading ? (
        <div className="text-sm text-fg-3">Loading…</div>
      ) : !data || data.length === 0 ? (
        <div className="text-sm text-fg-3">No backlinks yet.</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {data.map((b) => (
            <li key={b.source_block_id}>
              <Link
                href={`/notes/${encodeURIComponent(b.source_title)}`}
                className="block rounded-sm px-2 py-1.5 text-sm text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
              >
                {b.source_title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
