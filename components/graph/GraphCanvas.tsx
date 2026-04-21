"use client";

import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphNode } from "@/lib/queries/graph";

type Edge = { source: string; target: string };

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: Edge[];
  onSelect?: (n: GraphNode | null) => void;
}

type FGNode = GraphNode & { x?: number; y?: number; color?: string };
type FGLink = { source: string; target: string };

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const KIND_COLOR: Record<string, { css: string; fallback: string }> = {
  page: { css: "--accent-primary", fallback: "#3D49F5" },
  lead: { css: "--apricot-500", fallback: "#FF8A3D" },
  task: { css: "--sage-500", fallback: "#4F9868" },
  card: { css: "--sage-500", fallback: "#4F9868" },
};

export function GraphCanvas({ nodes, edges, onSelect }: GraphCanvasProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<FGNode, FGLink> | undefined>(undefined);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colors, setColors] = useState({
    bg: "#FBFAF7",
    fg1: "#1A1D21",
    fg3: "#6B7280",
    edge: "#E5E3DC",
    accent: "#3D49F5",
    accentTint: "#EDEEFD",
  });

  useEffect(() => {
    setColors({
      bg: readVar("--surface-raised", "#FBFAF7"),
      fg1: readVar("--fg-1", "#1A1D21"),
      fg3: readVar("--fg-3", "#6B7280"),
      edge: readVar("--border-subtle", "#E5E3DC"),
      accent: readVar("--accent-primary", "#3D49F5"),
      accentTint: readVar("--accent-tint", "#EDEEFD"),
    });
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ w: Math.max(200, rect.width), h: Math.max(200, rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodeSet = new Set(nodes.map((n) => n.id));
    return {
      nodes: nodes.map((n): FGNode => {
        const kind = KIND_COLOR[n.kind] ?? KIND_COLOR.page;
        return { ...n, color: readVar(kind.css, kind.fallback) };
      }),
      links: edges
        .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
        .map((e): FGLink => ({ source: e.source, target: e.target })),
    };
  }, [nodes, edges]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      fg.d3Force("charge")?.strength(-220);
      fg.d3Force("link")?.distance(70);
    } catch {}
  }, [graphData]);

  const selectedConnected = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const out = new Set<string>();
    for (const e of edges) {
      if (e.source === selectedId) out.add(e.target);
      if (e.target === selectedId) out.add(e.source);
    }
    return out;
  }, [selectedId, edges]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <ForceGraph2D
        ref={fgRef as never}
        width={size.w}
        height={size.h}
        graphData={graphData}
        backgroundColor={colors.bg}
        nodeRelSize={5}
        linkColor={(link) => {
          if (!selectedId) return colors.edge;
          const s = typeof link.source === "string" ? link.source : (link.source as FGNode).id;
          const t = typeof link.target === "string" ? link.target : (link.target as FGNode).id;
          return s === selectedId || t === selectedId ? colors.accent : colors.edge;
        }}
        linkWidth={(link) => {
          if (!selectedId) return 1;
          const s = typeof link.source === "string" ? link.source : (link.source as FGNode).id;
          const t = typeof link.target === "string" ? link.target : (link.target as FGNode).id;
          return s === selectedId || t === selectedId ? 1.8 : 0.6;
        }}
        cooldownTime={2500}
        enableNodeDrag
        onNodeHover={(n) => setHoverId(n ? (n as FGNode).id : null)}
        onBackgroundClick={() => {
          setSelectedId(null);
          onSelect?.(null);
        }}
        onNodeClick={(n) => {
          const node = n as FGNode;
          setSelectedId(node.id);
          onSelect?.(node);
        }}
        nodeCanvasObject={(n, ctx, globalScale) => {
          const node = n as FGNode;
          const id = node.id;
          const isSel = selectedId === id;
          const isConn = selectedConnected.has(id);
          const isHover = hoverId === id;
          const dim = selectedId && !isSel && !isConn;

          const baseR = isSel ? 9 : isConn ? 7 : 5.2;
          const r = isHover ? baseR + 1.5 : baseR;

          if (isSel) {
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, r + 5, 0, 2 * Math.PI);
            ctx.fillStyle = colors.accentTint;
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
          ctx.fillStyle = node.color || colors.accent;
          ctx.globalAlpha = dim ? 0.25 : 1;
          ctx.fill();

          ctx.lineWidth = 1.5 / globalScale;
          ctx.strokeStyle = colors.bg;
          ctx.stroke();
          ctx.globalAlpha = 1;

          if (isSel || isHover || globalScale > 1.4) {
            const label = node.label;
            const fontSize = Math.max(10 / globalScale, 11);
            ctx.font = `${isSel ? 600 : 500} ${fontSize}px var(--font-inter), Inter, system-ui, sans-serif`;
            const textY = (node.y ?? 0) + r + fontSize + 2;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            const metrics = ctx.measureText(label);
            const pad = 4;
            ctx.fillStyle = colors.bg;
            ctx.globalAlpha = 0.92;
            ctx.fillRect(
              (node.x ?? 0) - metrics.width / 2 - pad,
              textY - fontSize / 2 - pad / 2,
              metrics.width + pad * 2,
              fontSize + pad,
            );
            ctx.globalAlpha = 1;
            ctx.fillStyle = isSel ? colors.accent : colors.fg1;
            ctx.fillText(label, node.x ?? 0, textY);
          }
        }}
      />
    </div>
  );
}
