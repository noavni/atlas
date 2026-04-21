"use client";

import { use } from "react";
import { LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";

interface Params {
  params: Promise<{ projectId: string }>;
}

export default function BoardPage({ params }: Params) {
  const { projectId } = use(params);
  const pretty = decodeURIComponent(projectId).replace(/-/g, " ");
  return (
    <AppShell crumbs={["Atlas", "Boards", pretty]}>
      <div className="px-7 pb-12 pt-7">
        <PageHeading eyebrow="Project" title={pretty} />
        <EmptyState
          icon={<Icon icon={LayoutGrid} size={28} />}
          title="Board UI lands in Phase 1."
          hint="Kanban columns, cards with LexoRank, drag-with-mass — coming next."
        />
      </div>
    </AppShell>
  );
}
