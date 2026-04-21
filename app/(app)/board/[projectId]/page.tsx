"use client";

import { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeading } from "@/components/shell/PageHeading";
import { Board } from "@/components/board/Board";

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
        <Board projectId={projectId} />
      </div>
    </AppShell>
  );
}
