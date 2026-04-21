"use client";

import { Network } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";
import { GraphCanvas } from "@/components/graph/GraphCanvasLazy";
import { useMe } from "@/lib/queries/me";
import { useGraph } from "@/lib/queries/graph";

export default function GraphPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const graph = useGraph(workspaceId);
  const router = useRouter();

  const nodes = graph.data?.nodes ?? [];
  const edges = graph.data?.edges ?? [];

  return (
    <AppShell crumbs={["Atlas", "Graph"]}>
      <div className="px-7 pb-12 pt-7">
        <PageHeading
          title="Graph"
          eyebrow={nodes.length ? `${nodes.length} notes · ${edges.length} links` : undefined}
        />
        {graph.isLoading ? (
          <div className="text-sm text-fg-3">Building graph…</div>
        ) : nodes.length === 0 ? (
          <EmptyState
            icon={<Icon icon={Network} size={28} />}
            title="No notes yet."
            hint="Create notes and link them with [[double brackets]] — the graph draws itself."
          />
        ) : (
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onSelect={(n) => router.push(`/notes/${encodeURIComponent(n.label)}`)}
          />
        )}
      </div>
    </AppShell>
  );
}
