"use client";

import { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeading } from "@/components/shell/PageHeading";
import { Board } from "@/components/board/Board";
import { useMe } from "@/lib/queries/me";
import { useProjects } from "@/lib/queries/projects";

interface Params {
  params: Promise<{ projectId: string }>;
}

export default function BoardPage({ params }: Params) {
  const { projectId } = use(params);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const projects = useProjects(workspaceId);
  const project = projects.data?.find((p) => p.id === projectId);
  const title = project?.name ?? "Loading…";

  return (
    <AppShell crumbs={["Atlas", "Boards", title]} fullHeight>
      <div className="flex h-full flex-col px-7 pb-6 pt-7">
        <PageHeading eyebrow="Project" title={title} />
        <div className="min-h-0 flex-1">
          <Board projectId={projectId} />
        </div>
      </div>
    </AppShell>
  );
}
