"use client";

import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { GraphNode } from "@/lib/queries/graph";

type Edge = { source: string; target: string };

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: Edge[];
  onSelect?: (n: GraphNode | null) => void;
  onOpen?: (n: GraphNode) => void;
}

type FGNode = GraphNode & { x?: number; y?: number; color?: string; __degree?: number };
type FGLink = { source: string; target: string };

export interface GraphCanvasHandle {
  zoomBy: (factor: number) => void;
  zoomToFit: () => void;
  focusNode: (id: string) => void;
}

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export const GraphCanvas = forwardRef<GraphCanvasHandle, GraphCanvasProps>(function GraphCanvas(
  { nodes, edges, onSelect, onOpen },
  ref,
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods<FGNode, FGLink> | undefined>(undefined);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [colors, setColors] = useState({
    bg: "#FBFAF7",
    fg1: "#1A1D21",
    edge: "#E5E3DC",
    accent: "#3D49F5",
    accentTint: "#EDEEFD",
    hub: "#FF8A3D",
    orphan: "#B8B6B0",
  });

  useEffect(() => {
    setColors({
      bg: readVar("--surface-raised", "#FBFAF7"),
      fg1: readVar("--fg-1", "#1A1D21"),
      edge: readVar("--border-subtle", "#E5E3DC"),
      accent: readVar("--accent-primary", "#3D49F5"),
      accentTint: readVar("--accent-tint", "#EDEEFD"),
      hub: readVar("--apricot-500", "#FF8A3D"),
      orphan: readVar("--fg-4", "#B8B6B0"),
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

  const { graphData, degree } = useMemo(() => {
    const deg = new Map<string, number>();
    for (const n of nodes) deg.set(n.id, 0);
    for (const e of edges) {
      deg.set(e.source, (deg.get(e.source) ?? 0) + 1);
      deg.set(e.target, (deg.get(e.target) ?? 0) + 1);
    }
    const nodeSet = new Set(nodes.map((n) => n.id));
    const fgNodes: FGNode[] = nodes.map((n) => ({
      ...n,
      __degree: deg.get(n.id) ?? 0,
    }));
    const fgLinks: FGLink[] = edges
      .filter((e) => nodeSet.has(e.source) && nodeSet.has(e.target))
      .map((e) => ({ source: e.source, target: e.target }));
    return { graphData: { nodes: fgNodes, links: fgLinks }, degree: deg };
  }, [nodes, edges]);

  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    try {
      fg.d3Force("charge")?.strength(-260);
      fg.d3Force("link")?.distance(90);
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

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (factor: number) => {
        const fg = fgRef.current;
        if (!fg) return;
        const z = fg.zoom();
        fg.zoom(z * factor, 300);
      },
      zoomToFit: () => {
        fgRef.current?.zoomToFit(400, 40);
      },
      focusNode: (id: string) => {
        const fg = fgRef.current;
        if (!fg) return;
        const n = graphData.nodes.find((x) => x.id === id);
        if (!n || n.x == null || n.y == null) return;
        fg.centerAt(n.x, n.y, 600);
        fg.zoom(2, 600);
      },
    }),
    [graphData],
  );

  function colorFor(node: FGNode): string {
    if (node.__degree === 0) return colors.orphan;
    if ((node.__degree ?? 0) >= 5) return colors.hub;
    return colors.accent;
  }

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
          return s === selectedId || t === selectedId ? 2 : 0.6;
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
        onNodeRightClick={(n) => onOpen?.(n as FGNode)}
        onNodeDrag={(n) => {
          (n as FGNode & { fx?: number; fy?: number }).fx = (n as FGNode).x;
          (n as FGNode & { fx?: number; fy?: number }).fy = (n as FGNode).y;
        }}
        onNodeDragEnd={(n) => {
          (n as FGNode & { fx?: number | null; fy?: number | null }).fx = null;
          (n as FGNode & { fx?: number | null; fy?: number | null }).fy = null;
        }}
        nodeCanvasObject={(n, ctx, globalScale) => {
          const node = n as FGNode;
          const id = node.id;
          const isSel = selectedId === id;
          const isConn = selectedConnected.has(id);
          const isHover = hoverId === id;
          const dim = selectedId && !isSel && !isConn;
          const deg = degree.get(id) ?? 0;

          const baseR = isSel ? 10 : deg >= 5 ? 8 : deg === 0 ? 4.2 : 5.6;
          const r = isHover ? baseR + 1.5 : baseR;
          const fill = colorFor(node);

          if (isSel) {
            ctx.beginPath();
            ctx.arc(node.x ?? 0, node.y ?? 0, r + 6, 0, 2 * Math.PI);
            ctx.fillStyle = colors.accentTint;
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          ctx.beginPath();
          ctx.arc(node.x ?? 0, node.y ?? 0, r, 0, 2 * Math.PI);
          ctx.fillStyle = fill;
          ctx.globalAlpha = dim ? 0.22 : 1;
          ctx.fill();

          ctx.lineWidth = 1.5 / globalScale;
          ctx.strokeStyle = colors.bg;
          ctx.stroke();
          ctx.globalAlpha = 1;

          if (isSel || isHover || (globalScale > 1.4 && deg > 0)) {
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
});
