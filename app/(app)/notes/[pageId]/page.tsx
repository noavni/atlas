"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { BacklinksPanel } from "@/components/notes/BacklinksPanel";
import { NoteEditor } from "@/components/notes/NoteEditorLazy";
import { NoteToolbar } from "@/components/notes/NoteToolbar";
import { Icon } from "@/components/primitives/Icon";
import { useMe } from "@/lib/queries/me";
import { useCreatePage, usePage, usePages } from "@/lib/queries/pages";
import { cn } from "@/lib/utils";

interface Params {
  params: Promise<{ pageId: string }>;
}

export default function NotePage({ params }: Params) {
  const { pageId } = use(params);
  const title = decodeURIComponent(pageId);
  const router = useRouter();

  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const pages = usePages(workspaceId);
  const match = pages.data?.find((p) => p.title === title);
  const page = usePage(match?.id);
  const createPage = useCreatePage();

  function onNew() {
    if (!workspaceId) return;
    const taken = new Set((pages.data ?? []).map((p) => p.title));
    let t = "Untitled";
    if (taken.has(t))
      for (let n = 2; n < 1000; n++) {
        if (!taken.has(`Untitled ${n}`)) {
          t = `Untitled ${n}`;
          break;
        }
      }
    const newId = crypto.randomUUID();
    router.push(`/notes/${encodeURIComponent(t)}`);
    createPage.mutate({ workspaceId, id: newId, title: t });
  }

  return (
    <AppShell crumbs={["Atlas", "Notes", title]} fullHeight>
      <div className="grid h-full min-h-0 grid-cols-[260px_1fr_280px]">
        <aside className="atlas-board-scroll flex h-full min-h-0 flex-col overflow-y-auto border-e border-border-subtle bg-surface-app">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 bg-surface-app/95 px-4 py-3 backdrop-blur">
            <div className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
              All notes · {pages.data?.length ?? 0}
            </div>
            <button
              type="button"
              onClick={onNew}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-border-subtle bg-surface-raised px-2.5 text-[11.5px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
            >
              <Icon icon={Plus} size={11} /> New
            </button>
          </div>
          <ul className="flex flex-col gap-px px-2 pb-4">
            {(pages.data ?? []).map((p) => {
              const active = p.title === title;
              return (
                <li key={p.id}>
                  <Link
                    href={`/notes/${encodeURIComponent(p.title)}`}
                    prefetch
                    className={cn(
                      "flex flex-col gap-0.5 rounded-[10px] px-3 py-2.5 transition-colors",
                      active
                        ? "border border-[color-mix(in_oklch,var(--accent-primary)_25%,transparent)] bg-accent-tint"
                        : "hover:bg-surface-hover",
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
              );
            })}
          </ul>
        </aside>

        <article className="atlas-board-scroll flex h-full min-h-0 flex-col overflow-y-auto">
          <div className="mx-auto w-full max-w-[760px] px-10 py-12">
            <h1
              dir="auto"
              className="mb-2 font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.022em] text-fg-1"
            >
              {title}
            </h1>
            <div className="mb-7 flex items-center gap-2 text-[12px] text-fg-3">
              <span>Edited {page.data ? timeAgo(page.data.updated_at) : ""}</span>
            </div>
            {page.isLoading ? (
              <div className="min-h-[65vh] animate-pulse rounded-md bg-surface-2/40" />
            ) : page.data ? (
              <NoteEditor page={page.data} />
            ) : (
              <div className="font-serif text-[18px] leading-[1.68] text-fg-3">
                No note with that title yet. Pick one from the list or press{" "}
                <span className="font-mono">⌘⇧N</span>.
              </div>
            )}
          </div>
        </article>

        <aside className="atlas-board-scroll flex h-full min-h-0 flex-col overflow-y-auto border-s border-border-subtle bg-surface-app">
          <NoteToolbar />
          {page.data && (
            <div className="mt-auto border-t border-border-subtle px-5 py-5">
              <BacklinksPanel pageId={page.data.id} />
            </div>
          )}
        </aside>
      </div>
    </AppShell>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}
