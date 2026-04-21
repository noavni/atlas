"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Project } from "@/lib/types";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => apiFetch<Project[]>(`/v1/workspaces/${workspaceId}/projects`),
    enabled: !!workspaceId,
  });
}
