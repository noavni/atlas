"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";

export interface PageSummary {
  id: string;
  workspace_id: string;
  title: string;
  parent_page_id: string | null;
  rank: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PageDoc extends PageSummary {
  content: Record<string, unknown>;
}

export interface Backlink {
  source_page_id: string;
  source_title: string;
  source_block_id: string;
  link_text: string;
}

export function usePages(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["pages", workspaceId],
    queryFn: () => apiFetch<PageSummary[]>(`/v1/workspaces/${workspaceId}/pages`),
    enabled: !!workspaceId,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function usePage(pageId: string | undefined) {
  return useQuery({
    queryKey: ["page", pageId],
    queryFn: () => apiFetch<PageDoc>(`/v1/pages/${pageId}`),
    enabled: !!pageId,
    staleTime: 2 * 60_000,
    gcTime: 30 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useBacklinks(pageId: string | undefined) {
  return useQuery({
    queryKey: ["backlinks", pageId],
    queryFn: () => apiFetch<Backlink[]>(`/v1/pages/${pageId}/backlinks`),
    enabled: !!pageId,
  });
}

interface CreatePageInput {
  workspaceId: string;
  title: string;
  id?: string;
  parentPageId?: string;
}

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePageInput) => {
      const id = input.id ?? uuid();
      return apiFetch<PageDoc>(`/v1/workspaces/${input.workspaceId}/pages`, {
        method: "POST",
        idempotencyKey: `page.create:${id}`,
        body: JSON.stringify({
          id,
          title: input.title,
          parent_page_id: input.parentPageId,
        }),
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["pages", input.workspaceId] });
      const prev = qc.getQueryData<PageSummary[]>(["pages", input.workspaceId]);
      const now = new Date().toISOString();
      const optimistic: PageSummary = {
        id: input.id ?? uuid(),
        workspace_id: input.workspaceId,
        title: input.title,
        parent_page_id: input.parentPageId ?? null,
        rank: "0|zzzz",
        version: 1,
        created_at: now,
        updated_at: now,
      };
      qc.setQueryData<PageSummary[]>(
        ["pages", input.workspaceId],
        [optimistic, ...(prev ?? [])],
      );
      // Also seed the detail cache so /notes/{title} renders instantly
      qc.setQueryData<PageDoc>(["page", optimistic.id], {
        ...optimistic,
        content: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
      });
      return { prev, optimisticId: optimistic.id };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["pages", input.workspaceId], ctx.prev);
    },
    onSuccess: (page, input) => {
      qc.setQueryData(["page", page.id], page);
      qc.invalidateQueries({ queryKey: ["pages", input.workspaceId] });
    },
  });
}

interface UpdatePageInput {
  pageId: string;
  version: number;
  title?: string;
  content?: Record<string, unknown>;
}

export function useUpdatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdatePageInput) => {
      const { pageId, ...rest } = input;
      return apiFetch<PageDoc>(`/v1/pages/${pageId}`, {
        method: "PATCH",
        idempotencyKey: `page.update:${pageId}:${rest.version}`,
        body: JSON.stringify(rest),
      });
    },
    onSuccess: (page) => {
      qc.setQueryData(["page", page.id], page);
    },
  });
}
