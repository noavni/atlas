"use client";

import {
  Maximize2,
  Minus,
  Network,
  Plus,
  Search,
  Settings2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { GraphCanvas, type GraphCanvasHandle } from "@/components/graph/GraphCanvasLazy";
import { useMe } from "@/lib/queries/me";
import { useGraph } from "@/lib/queries/graph";
import type { GraphNode } from "@/lib/queries/graph";
import { cn } from "@/lib/utils";

export default function GraphPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const graph = useGraph(workspaceId);
  const router = useRouter();
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [query, setQuery] = useState("");
  const [hideOrphans, setHideOrphans] = useState(false);
  const canvasRef = useRef<GraphCanvasHandle>(null);

  const nodes = graph.data?.nodes ?? [];
  const edges = graph.data?.edges ?? [];

  const degreeById = useMemo(() => {
    const d = new Map<string, number>();
    for (const n of nodes) d.set(n.id, 0);
    for (const e of edges) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    }
    return d;
  }, [nodes, edges]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filteredNodes = nodes.filter((n) => {
      if (hideOrphans && (degreeById.get(n.id) ?? 0) === 0) return false;
      if (q && !n.label.toLowerCase().includes(q)) return false;
      return true;
    });
    const ids = new Set(filteredNodes.map((n) => n.id));
    const filteredEdges = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [nodes, edges, query, hideOrphans, degreeById]);

  const connected = useMemo(() => {
    if (!selected) return [] as GraphNode[];
    const n = new Set<string>();
    for (const e of edges) {
      if (e.source === selected.id) n.add(e.target);
      if (e.target === selected.id) n.add(e.source);
    }
    return nodes.filter((x) => n.has(x.id));
  }, [edges, nodes, selected]);

  return (
    <AppShell crumbs={["Atlas", "Graph"]} fullHeight>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-end justify-between gap-4 border-b border-border-subtle px-10 pb-4 pt-7">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
              Knowledge map
            </div>
            <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg-1">
              Graph
            </h1>
            <div className="mt-1 text-[12.5px] text-fg-3">
              {filtered.nodes.length} of {nodes.length} notes ·{" "}
              {filtered.edges.length} links
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 min-w-[240px] items-center gap-2 rounded-full border border-border-subtle bg-surface-raised px-3 shadow-1">
              <Icon icon={Search} size={13} className="text-fg-3" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search nodes…"
                className="flex-1 bg-transparent text-[12.5px] text-fg-1 outline-none placeholder:text-fg-4"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-fg-3 hover:text-fg-1"
                  title="Clear"
                >
                  <Icon icon={X} size={12} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setHideOrphans((v) => !v)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-medium transition-colors",
                hideOrphans
                  ? "border-accent bg-accent-tint text-accent"
                  : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2",
              )}
            >
              <Icon icon={Settings2} size={13} />
              {hideOrphans ? "Orphans hidden" : "Show orphans"}
            </button>
          </div>
        </div>
        <div className="relative min-h-0 flex-1">
          {graph.isLoading ? (
            <div className="m-10 h-full animate-pulse rounded-2xl bg-surface-raised shadow-1" />
          ) : nodes.length === 0 ? (
            <div className="m-10 flex h-full items-center justify-center rounded-2xl bg-surface-raised shadow-1">
              <EmptyState
                icon={<Icon icon={Network} size={28} />}
                title="No notes yet."
                hint="Create notes and link them with [[double brackets]] — the graph draws itself."
              />
            </div>
          ) : (
            <div className="relative h-full">
              <GraphCanvas
                ref={canvasRef}
                nodes={filtered.nodes}
                edges={filtered.edges}
                onSelect={(n) => setSelected(n)}
                onOpen={(n) => {
                  router.push(`/notes/${encodeURIComponent(n.label)}`);
                }}
              />

              {/* Zoom controls, bottom-left */}
              <div
                className="absolute bottom-5 start-5 flex items-center gap-0.5 rounded-full border border-border-subtle p-0.5 shadow-2"
                style={{
                  background: "var(--material-thick)",
                  backdropFilter: "blur(24px) saturate(140%)",
                  WebkitBackdropFilter: "blur(24px) saturate(140%)",
                }}
              >
                <IconButton
                  size="sm"
                  title="Zoom in"
                  onClick={() => canvasRef.current?.zoomBy(1.3)}
                >
                  <Icon icon={Plus} size={13} />
                </IconButton>
                <IconButton
                  size="sm"
                  title="Zoom out"
                  onClick={() => canvasRef.current?.zoomBy(0.77)}
                >
                  <Icon icon={Minus} size={13} />
                </IconButton>
                <div className="mx-0.5 h-5 w-px bg-border-subtle" />
                <IconButton
                  size="sm"
                  title="Zoom to fit"
                  onClick={() => canvasRef.current?.zoomToFit()}
                >
                  <Icon icon={Maximize2} size={13} />
                </IconButton>
              </div>

              {/* Legend, bottom-center */}
              <div
                className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-border-subtle px-3.5 py-2 shadow-2"
                style={{
                  background: "var(--material-thick)",
                  backdropFilter: "blur(24px) saturate(140%)",
                  WebkitBackdropFilter: "blur(24px) saturate(140%)",
                }}
              >
                {[
                  { label: "Notes", color: "var(--accent-primary)" },
                  { label: "Hubs (5+ links)", color: "var(--apricot-500)" },
                  { label: "Orphans", color: "var(--fg-4)" },
                ].map((l) => (
                  <span
                    key={l.label}
                    className="inline-flex items-center gap-1.5 text-[11.5px] text-fg-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: l.color }}
                      aria-hidden="true"
                    />
                    {l.label}
                  </span>
                ))}
              </div>

              {selected && (
                <div
                  className="absolute end-5 top-5 w-[300px] overflow-hidden rounded-2xl border border-border-subtle p-4 shadow-3"
                  style={{
                    background: "var(--material-thick)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                      Selected
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="text-fg-3 hover:text-fg-1"
                      title="Clear"
                    >
                      <Icon icon={X} size={12} />
                    </button>
                  </div>
                  <h4 className="font-display text-[20px] font-semibold leading-[1.15] tracking-[-0.018em] text-fg-1">
                    {selected.label}
                  </h4>
                  <div className="mt-2 flex gap-5 text-[11.5px]">
                    <span>
                      <b className="text-fg-1">{connected.length}</b>
                      <span className="ms-1 text-fg-3">connected</span>
                    </span>
                    <span>
                      <b className="text-fg-1">{degreeById.get(selected.id) ?? 0}</b>
                      <span className="ms-1 text-fg-3">degree</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/notes/${encodeURIComponent(selected.label)}`)
                    }
                    className="mt-3 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-accent text-[12.5px] font-medium text-fg-on-accent shadow-1 transition-opacity hover:opacity-90"
                  >
                    Open note
                  </button>
                  <div className="mt-4 h-px bg-border-subtle" />
                  <div className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                    Connected
                  </div>
                  <ul className="mt-1.5 flex max-h-[200px] flex-col gap-0.5 overflow-y-auto">
                    {connected.slice(0, 12).map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/notes/${encodeURIComponent(n.label)}`)
                          }
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[12.5px] text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
                        >
                          <span
                            className="h-1.5 w-1.5 flex-none rounded-full bg-accent"
                            aria-hidden="true"
                          />
                          <span className="truncate">{n.label}</span>
                        </button>
                      </li>
                    ))}
                    {connected.length === 0 && (
                      <li className="px-2 py-1 text-[11.5px] text-fg-3">
                        No connections yet.
                      </li>
                    )}
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
