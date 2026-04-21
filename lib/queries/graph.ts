"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface GraphNode {
  id: string;
  label: string;
  kind: "page";
}

export interface GraphEdge {
  source: string;
  target: string;
  count: number;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useGraph(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["graph", workspaceId],
    queryFn: () => apiFetch<GraphResponse>(`/v1/graph?workspace_id=${workspaceId}`),
    enabled: !!workspaceId,
  });
}
