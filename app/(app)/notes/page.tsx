"use client";

import { NotebookPen, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/primitives/Button";
import { EmptyState } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";
import { useMe } from "@/lib/queries/me";
import { useCreatePage, usePages } from "@/lib/queries/pages";
import { cn } from "@/lib/utils";

export default function NotesIndexPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const pages = usePages(workspaceId);
  const createPage = useCreatePage();
  const router = useRouter();

  const list = pages.data ?? [];

  function nextUntitled(): string {
    const taken = new Set(list.map((p) => p.title));
    if (!taken.has("Untitled")) return "Untitled";
    for (let n = 2; n < 1000; n++) if (!taken.has(`Untitled ${n}`)) return `Untitled ${n}`;
    return `Untitled ${Date.now()}`;
  }

  function onNew() {
    if (!workspaceId) {
      console.warn("No workspace yet — cannot create note.");
      return;
    }
    const title = nextUntitled();
    const id = uuid();
    // Navigate instantly; optimistic cache already has the new page so the
    // target route renders without waiting for the API round-trip.
    router.push(`/notes/${encodeURIComponent(title)}`);
    createPage.mutate({ workspaceId, id, title });
  }

  return (
    <AppShell crumbs={["Atlas", "Notes"]} fullHeight>
      <div className="grid h-full min-h-0 grid-cols-[280px_1fr]">
        <aside className="atlas-board-scroll flex h-full min-h-0 flex-col overflow-y-auto border-e border-border-subtle bg-surface-app">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface-app/95 px-4 py-3 backdrop-blur">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
              All notes · {list.length}
            </div>
            <button
              type="button"
              onClick={onNew}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-border-subtle bg-surface-raised px-2.5 text-[11.5px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
            >
              <Icon icon={Plus} size={11} /> New
            </button>
          </div>
          {pages.isLoading && (
            <div className="space-y-1.5 px-2 py-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-md bg-surface-2" />
              ))}
            </div>
          )}
          <ul className="flex flex-col gap-px px-2 pb-4">
            {list.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/notes/${encodeURIComponent(p.title)}`}
                  prefetch
                  className={cn(
                    "group flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5 transition-colors",
                    "hover:bg-surface-hover",
                  )}
                >
                  <div className="truncate text-[13px] font-semibold text-fg-1">{p.title}</div>
                  <div className="text-[10.5px] text-fg-4">
                    {new Date(p.updated_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <div className="atlas-board-scroll flex h-full min-h-0 flex-col overflow-y-auto">
          {list.length === 0 ? (
            <EmptyState
              icon={<Icon icon={NotebookPen} size={28} />}
              title="No notes yet."
              hint="Start with one — a line, a thought. Use [[double brackets]] to link."
              action={
                <Button variant="primary" onClick={onNew} disabled={!workspaceId}>
                  New note
                </Button>
              }
            />
          ) : (
            <div className="mx-auto flex h-full w-full max-w-[680px] flex-col items-center justify-center px-10 py-20 text-center">
              <div className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.022em] text-fg-1">
                Pick a note from the list
              </div>
              <p className="mt-2 text-[14px] text-fg-3">
                Or press <span className="font-mono">⌘⇧N</span> to open a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
