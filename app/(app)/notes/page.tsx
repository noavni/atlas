"use client";

import { NotebookPen, Plus } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { useMe } from "@/lib/queries/me";
import { useCreatePage, usePages } from "@/lib/queries/pages";
import { useRouter } from "next/navigation";

export default function NotesIndexPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const pages = usePages(workspaceId);
  const createPage = useCreatePage();
  const router = useRouter();

  function onNew() {
    if (!workspaceId) return;
    createPage.mutate(
      { workspaceId, title: "Untitled" },
      {
        onSuccess: (p) => router.push(`/notes/${encodeURIComponent(p.title)}`),
      },
    );
  }

  return (
    <AppShell crumbs={["Atlas", "Notes"]}>
      <div className="mx-auto max-w-[720px] px-7 pb-12 pt-7">
        <PageHeading
          title="Notes"
          actions={
            <Button
              variant="primary"
              leadingIcon={<Icon icon={Plus} size={14} />}
              onClick={onNew}
              disabled={!workspaceId || createPage.isPending}
            >
              New note
            </Button>
          }
        />
        {pages.isLoading || me.isLoading ? (
          <div className="mt-4 text-sm text-fg-3">Loading…</div>
        ) : !pages.data || pages.data.length === 0 ? (
          <EmptyState
            icon={<Icon icon={NotebookPen} size={28} />}
            title="No notes yet."
            hint="Start with one — a line, a thought. Use [[...]] to link between notes."
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-px">
            {pages.data.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/notes/${encodeURIComponent(p.title)}`}
                  className="flex items-center gap-3 rounded-sm px-3 py-2 text-md text-fg-1 transition-colors hover:bg-surface-hover"
                >
                  <Icon icon={NotebookPen} size={16} />
                  <span className="truncate">{p.title}</span>
                  <span className="ms-auto text-xs text-fg-3">
                    {new Date(p.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
