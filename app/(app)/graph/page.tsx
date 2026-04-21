"use client";

import { Minus, Network, Plus, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { GraphCanvas } from "@/components/graph/GraphCanvasLazy";
import { useMe } from "@/lib/queries/me";
import { useGraph } from "@/lib/queries/graph";
import type { GraphNode } from "@/lib/queries/graph";

export default function GraphPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const graph = useGraph(workspaceId);
  const router = useRouter();
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const nodes = graph.data?.nodes ?? [];
  const edges = graph.data?.edges ?? [];

  const connected = useMemo(() => {
    if (!selected) return [] as GraphNode[];
    const n = new Set<string>();
    for (const e of edges) {
      if (e.source === selected.id) n.add(e.target);
      if (e.target === selected.id) n.add(e.source);
    }
    return nodes.filter((x) => n.has(x.id)).slice(0, 8);
  }, [edges, nodes, selected]);

  return (
    <AppShell crumbs={["Atlas", "Graph"]} fullHeight>
      <div className="flex h-full min-h-0 flex-col">
        <div className="px-10 pt-7">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
            Knowledge map
          </div>
          <PageHeading
            title="Graph"
            eyebrow={`${nodes.length} notes · ${edges.length} links`}
          />
        </div>
        <div className="relative min-h-0 flex-1 px-10 pb-10 pt-2">
          {graph.isLoading ? (
            <div className="h-full w-full animate-pulse rounded-2xl bg-surface-raised shadow-1" />
          ) : nodes.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-2xl bg-surface-raised shadow-1">
              <EmptyState
                icon={<Icon icon={Network} size={28} />}
                title="No notes yet."
                hint="Create notes and link them with [[double brackets]] — the graph draws itself."
              />
            </div>
          ) : (
            <div className="relative h-full overflow-hidden rounded-2xl bg-surface-raised shadow-1">
              <GraphCanvas nodes={nodes} edges={edges} onSelect={(n) => setSelected(n)} />

              <div
                className="absolute start-4 top-4 flex items-center gap-0.5 rounded-full border border-border-subtle p-0.5 shadow-2"
                style={{
                  background: "var(--material-thick)",
                  backdropFilter: "blur(24px) saturate(140%)",
                  WebkitBackdropFilter: "blur(24px) saturate(140%)",
                }}
              >
                <IconButton size="sm" title="Zoom in"><Icon icon={Plus} size={13} /></IconButton>
                <IconButton size="sm" title="Zoom out"><Icon icon={Minus} size={13} /></IconButton>
                <div className="mx-0.5 h-5 w-px bg-border-subtle" />
                <IconButton size="sm" title="Settings"><Icon icon={Settings2} size={13} /></IconButton>
              </div>

              <div
                className="absolute bottom-4 start-4 flex items-center gap-4 rounded-full border border-border-subtle px-3.5 py-2 shadow-2"
                style={{
                  background: "var(--material-thick)",
                  backdropFilter: "blur(24px) saturate(140%)",
                  WebkitBackdropFilter: "blur(24px) saturate(140%)",
                }}
              >
                {[
                  { label: "Notes", color: "var(--accent-primary)" },
                  { label: "Leads", color: "var(--apricot-500)" },
                  { label: "Tasks", color: "var(--sage-500)" },
                ].map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-fg-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />
                    {l.label}
                  </span>
                ))}
              </div>

              {selected && (
                <div
                  className="absolute end-4 top-4 w-[280px] overflow-hidden rounded-2xl border border-border-subtle p-4 shadow-3"
                  style={{
                    background: "var(--material-thick)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  }}
                >
                  <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Selected</div>
                  <h4 className="font-display text-[20px] font-normal italic leading-[1.15] tracking-[-0.018em] text-fg-1">
                    {selected.label}
                  </h4>
                  <div className="mt-2 flex gap-5 text-[11.5px]">
                    <span><b className="text-fg-1">{connected.length}</b><span className="ms-1 text-fg-3">connected</span></span>
                  </div>
                  <div className="mt-4 h-px bg-border-subtle" />
                  <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Connected</div>
                  <ul className="mt-1.5 flex flex-col gap-0.5">
                    {connected.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => router.push(`/notes/${encodeURIComponent(n.label)}`)}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[12.5px] text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
                        >
                          <span className="h-1.5 w-1.5 flex-none rounded-full bg-accent" aria-hidden="true" />
                          <span className="truncate">{n.label}</span>
                        </button>
                      </li>
                    ))}
                    {connected.length === 0 && <li className="px-2 py-1 text-[11.5px] text-fg-3">No connections.</li>}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
