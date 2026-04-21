"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface SearchHit {
  kind: "card" | "page" | "inbox";
  id: string;
  title: string;
  snippet: string;
  score: number;
}

export function useSearch(workspaceId: string | undefined, q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: ["search", workspaceId, trimmed],
    queryFn: async () => {
      if (!workspaceId || !trimmed) return [] as SearchHit[];
      const url = `/v1/search?workspace_id=${workspaceId}&q=${encodeURIComponent(trimmed)}`;
      return apiFetch<SearchHit[]>(url);
    },
    enabled: !!workspaceId && trimmed.length > 0,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
