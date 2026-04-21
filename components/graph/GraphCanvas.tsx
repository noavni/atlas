"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "@/lib/queries/graph";

/**
 * Lightweight force simulation on <canvas>. Keeps the bundle tiny (no d3
 * dep): Barnes-Hut would be overkill at our scale — for up to a few hundred
 * nodes, iterative pairwise repulsion + spring edges at 60fps is plenty.
 *
 * The simulation settles over ~400 iterations, then we keep a lazy loop so
 * drags/hover nudges don't freeze. Click a node to navigate.
 */
export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelect?: (node: GraphNode) => void;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const REPULSION = 900;
const SPRING = 0.015;
const DAMPING = 0.85;
const CENTER = 0.002;

export function GraphCanvas({ nodes, edges, onSelect }: GraphCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const sim: SimNode[] = useMemo(
    () =>
      nodes.map((n, i) => {
        const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
        return { ...n, x: 300 + 200 * Math.cos(a), y: 220 + 200 * Math.sin(a), vx: 0, vy: 0 };
      }),
    [nodes],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasEl = canvas;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      canvasEl.width = clientWidth * dpr;
      canvasEl.height = clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const ctx = canvasEl.getContext("2d")!;
    const nodeIndex = new Map<string, SimNode>(sim.map((n) => [n.id, n]));

    function step() {
      // Repulsion
      for (let i = 0; i < sim.length; i++) {
        for (let j = i + 1; j < sim.length; j++) {
          const a = sim[i]!;
          const b = sim[j]!;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy + 0.01;
          const f = REPULSION / d2;
          const fx = (dx / Math.sqrt(d2)) * f;
          const fy = (dy / Math.sqrt(d2)) * f;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }
      // Springs
      for (const edge of edges) {
        const a = nodeIndex.get(edge.source);
        const b = nodeIndex.get(edge.target);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        a.vx += dx * SPRING;
        a.vy += dy * SPRING;
        b.vx -= dx * SPRING;
        b.vy -= dy * SPRING;
      }
      // Centering + damping
      const cx = canvasEl.clientWidth / 2;
      const cy = canvasEl.clientHeight / 2;
      for (const n of sim) {
        n.vx = (n.vx + (cx - n.x) * CENTER) * DAMPING;
        n.vy = (n.vy + (cy - n.y) * CENTER) * DAMPING;
        n.x += n.vx;
        n.y += n.vy;
      }

      // Draw
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasEl.clientWidth, canvasEl.clientHeight);
      ctx.strokeStyle = "rgba(0,0,0,0.10)";
      ctx.lineWidth = 1;
      for (const edge of edges) {
        const a = nodeIndex.get(edge.source);
        const b = nodeIndex.get(edge.target);
        if (!a || !b) continue;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (const n of sim) {
        const r = n.id === hover ? 7 : 5;
        ctx.fillStyle = n.id === hover ? "var(--accent-primary)" : "var(--fg-3)";
        try {
          ctx.fillStyle = getComputedStyle(canvasEl).getPropertyValue(
            n.id === hover ? "--accent-primary" : "--fg-3",
          ).trim() || ctx.fillStyle;
        } catch {
          /* token lookup best-effort */
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (n.id === hover) {
          ctx.fillStyle = getComputedStyle(canvasEl).getPropertyValue("--fg-1").trim() || "#000";
          ctx.font = "500 12.5px system-ui, -apple-system";
          ctx.fillText(n.label, n.x + 10, n.y + 4);
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }
    step();

    function onMove(e: MouseEvent) {
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let nearest: { id: string; d: number } | null = null;
      for (const n of sim) {
        const d = Math.hypot(n.x - x, n.y - y);
        if (d < 12 && (!nearest || d < nearest.d)) nearest = { id: n.id, d };
      }
      setHover(nearest?.id ?? null);
    }
    function onClick() {
      if (!hover) return;
      const n = nodeIndex.get(hover);
      if (n && onSelect) onSelect(n);
    }
    canvasEl.addEventListener("mousemove", onMove);
    canvasEl.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("resize", resize);
      canvasEl.removeEventListener("mousemove", onMove);
      canvasEl.removeEventListener("click", onClick);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [sim, edges, hover, onSelect]);

  return (
    <canvas
      ref={canvasRef}
      className="h-[calc(100vh-220px)] w-full rounded-md bg-surface-raised shadow-1"
    />
  );
}
