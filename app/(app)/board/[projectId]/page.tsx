"use client";

import { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Board } from "@/components/board/Board";
import { useMe } from "@/lib/queries/me";
import { useProjects } from "@/lib/queries/projects";
import { useProjectColors } from "@/lib/store/projectColors";

interface Params {
  params: Promise<{ projectId: string }>;
}

// Deterministic hash fallback (matches Sidebar behavior)
const FALLBACK_DOTS = [
  "var(--persimmon-500)",
  "var(--sage-500)",
  "var(--indigo-500)",
  "var(--amber-500)",
  "var(--apricot-500)",
];
function hashDot(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return FALLBACK_DOTS[h % FALLBACK_DOTS.length]!;
}

export default function BoardPage({ params }: Params) {
  const { projectId } = use(params);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const projects = useProjects(workspaceId);
  const project = projects.data?.find((p) => p.id === projectId);
  const title = project?.name ?? "Loading…";
  const dot = useProjectColors((s) => s.getColor(projectId)) ?? hashDot(projectId);

  return (
    <AppShell crumbs={["Atlas", "Boards", title]} fullHeight>
      <div className="flex h-full flex-col px-7 pb-6 pt-7">
        <div className="mb-4 flex items-center gap-3 px-1">
          <span
            className="h-3.5 w-3.5 flex-none rounded-full shadow-1 ring-1 ring-inset ring-black/10"
            style={{ background: dot }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
              Project
            </div>
            <h1 className="m-0 truncate font-display text-[28px] font-semibold leading-[1.1] tracking-[-0.018em] text-fg-1">
              {title}
            </h1>
            {project?.description && (
              <div className="mt-0.5 truncate text-[13px] text-fg-3">
                {project.description}
              </div>
            )}
          </div>
        </div>
        <div className="min-h-0 flex-1">
          <Board projectId={projectId} />
        </div>
      </div>
    </AppShell>
  );
}
