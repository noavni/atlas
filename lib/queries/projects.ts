"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";
import type { Project } from "@/lib/types";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => apiFetch<Project[]>(`/v1/workspaces/${workspaceId}/projects`),
    enabled: !!workspaceId,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      name,
      description,
    }: {
      workspaceId: string;
      name: string;
      description?: string;
    }) => {
      const id = uuid();
      return apiFetch<Project>(`/v1/workspaces/${workspaceId}/projects`, {
        method: "POST",
        idempotencyKey: `project.create:${id}`,
        body: JSON.stringify({ id, name, description }),
      });
    },
    onSuccess: (_p, input) => {
      qc.invalidateQueries({ queryKey: ["projects", input.workspaceId] });
    },
  });
}
