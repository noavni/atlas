"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { GraphNode } from "@/lib/queries/graph";

export interface GraphCanvasHandle {
  zoomBy: (factor: number) => void;
  zoomToFit: () => void;
  focusNode: (id: string) => void;
}

export interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: { source: string; target: string }[];
  onSelect?: (n: GraphNode | null) => void;
  onOpen?: (n: GraphNode) => void;
  ref?: React.Ref<GraphCanvasHandle>;
}

export const GraphCanvas = dynamic(
  () => import("./GraphCanvas").then((m) => m.GraphCanvas as ComponentType<GraphCanvasProps>),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-surface-raised" />
    ),
  },
);
