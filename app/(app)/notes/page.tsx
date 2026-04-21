"use client";

import { NotebookPen } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";

export default function NotesIndexPage() {
  return (
    <AppShell crumbs={["Atlas", "Notes"]}>
      <div className="mx-auto max-w-reading px-7 pb-12 pt-7">
        <PageHeading title="Notes" />
        <EmptyState
          icon={<Icon icon={NotebookPen} size={28} />}
          title="No notes yet."
          hint="Notes arrive in Phase 2 — block-based, with [[wikilinks]] and live backlinks."
        />
      </div>
    </AppShell>
  );
}
