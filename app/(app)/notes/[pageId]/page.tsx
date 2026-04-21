"use client";

import { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { BacklinksPanel } from "@/components/notes/BacklinksPanel";
import { NoteEditor } from "@/components/notes/NoteEditorLazy";
import { useMe } from "@/lib/queries/me";
import { usePage, usePages } from "@/lib/queries/pages";

interface Params {
  params: Promise<{ pageId: string }>;
}

export default function NotePage({ params }: Params) {
  const { pageId } = use(params);
  const title = decodeURIComponent(pageId);

  // The route key is the title (human-readable URLs). Resolve to the page id
  // via the workspace's pages list. If more than one matches the newest one wins.
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const pages = usePages(workspaceId);
  const match = pages.data?.find((p) => p.title === title);
  const page = usePage(match?.id);

  return (
    <AppShell crumbs={["Atlas", "Notes", title]}>
      <article className="mx-auto max-w-reading px-7 pb-12 pt-7">
        <h1 className="mb-5 font-display text-[36px] font-semibold leading-[1.15] tracking-[-0.018em] text-fg-1">
          {title}
        </h1>
        {page.isLoading ? (
          <div className="text-sm text-fg-3">Loading…</div>
        ) : page.data ? (
          <>
            <NoteEditor page={page.data} />
            <BacklinksPanel pageId={page.data.id} />
          </>
        ) : (
          <div className="text-sm text-fg-3">
            No note with that title yet. Create one from the notes index.
          </div>
        )}
      </article>
    </AppShell>
  );
}
