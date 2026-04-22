"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";
import { useProjectColors } from "@/lib/store/projectColors";
import type { Project } from "@/lib/types";

export function useProjects(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: () => apiFetch<Project[]>(`/v1/workspaces/${workspaceId}/projects`),
    enabled: !!workspaceId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

interface CreateProjectInput {
  workspaceId: string;
  id?: string;
  name: string;
  description?: string;
  color?: string;
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      patch,
    }: {
      workspaceId: string;
      projectId: string;
      patch: Partial<Pick<Project, "name" | "description" | "status">>;
    }) => {
      return apiFetch<Project>(`/v1/projects/${projectId}`, {
        method: "PATCH",
        idempotencyKey: `project.update:${projectId}:${Date.now()}`,
        body: JSON.stringify(patch),
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["projects", input.workspaceId] });
      const prev = qc.getQueryData<Project[]>(["projects", input.workspaceId]);
      if (prev) {
        qc.setQueryData<Project[]>(
          ["projects", input.workspaceId],
          prev.map((p) => (p.id === input.projectId ? { ...p, ...input.patch } : p)),
        );
      }
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["projects", input.workspaceId], ctx.prev);
    },
    onSettled: (_d, _e, input) => {
      qc.invalidateQueries({ queryKey: ["projects", input.workspaceId] });
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const setColor = useProjectColors((s) => s.setColor);

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const id = input.id ?? uuid();
      if (input.color) setColor(id, input.color);
      return apiFetch<Project>(`/v1/workspaces/${input.workspaceId}/projects`, {
        method: "POST",
        idempotencyKey: `project.create:${id}`,
        body: JSON.stringify({
          id,
          name: input.name,
          description: input.description,
        }),
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["projects", input.workspaceId] });
      const prev = qc.getQueryData<Project[]>(["projects", input.workspaceId]);
      const now = new Date().toISOString();
      const optimistic: Project = {
        id: input.id ?? uuid(),
        workspace_id: input.workspaceId,
        name: input.name,
        description: input.description ?? null,
        status: "active",
        rank: "0|zzzz",
        created_at: now,
        updated_at: now,
      };
      if (input.color) setColor(optimistic.id, input.color);
      qc.setQueryData<Project[]>(
        ["projects", input.workspaceId],
        [...(prev ?? []), optimistic],
      );
      return { prev, optimisticId: optimistic.id };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["projects", input.workspaceId], ctx.prev);
    },
    onSuccess: (_p, input) => {
      qc.invalidateQueries({ queryKey: ["projects", input.workspaceId] });
    },
  });
}
