"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import type { MeResponse } from "@/lib/queries/me";
import type { Project } from "@/lib/types";

/**
 * Warms the cache with everything the shell eventually needs so routes
 * render data-first. Runs once on mount; respects QueryClient staleTime so
 * it's a no-op on subsequent renders.
 */
export function PrefetchBoot() {
  const qc = useQueryClient();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const me = await qc.fetchQuery({
          queryKey: ["me"],
          queryFn: () => apiFetch<MeResponse>("/v1/me"),
          staleTime: 5 * 60 * 1000,
        });
        if (!alive) return;
        const ws = me.workspaces[0];
        if (!ws) return;

        // Warm every primary query in parallel so back/forth nav is instant
        await Promise.allSettled([
          qc.prefetchQuery({
            queryKey: ["projects", ws.id],
            queryFn: () => apiFetch<Project[]>(`/v1/workspaces/${ws.id}/projects`),
            staleTime: 5 * 60 * 1000,
          }),
          qc.prefetchQuery({
            queryKey: ["pages", ws.id],
            queryFn: () => apiFetch(`/v1/workspaces/${ws.id}/pages`),
            staleTime: 5 * 60 * 1000,
          }),
          qc.prefetchQuery({
            queryKey: ["inbox", ws.id, "inbox"],
            queryFn: () => apiFetch(`/v1/inbox?workspace_id=${ws.id}&status=inbox`),
            staleTime: 60 * 1000,
          }),
          qc.prefetchQuery({
            queryKey: ["leads", ws.id],
            queryFn: () => apiFetch(`/v1/workspaces/${ws.id}/leads`),
            staleTime: 60 * 1000,
          }),
        ]);
      } catch {
        // Unauthenticated / offline — routes will retry on their own.
      }
    })();

    return () => {
      alive = false;
    };
  }, [qc]);

  return null;
}
