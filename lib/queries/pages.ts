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
  });
}

export function usePage(pageId: string | undefined) {
  return useQuery({
    queryKey: ["page", pageId],
    queryFn: () => apiFetch<PageDoc>(`/v1/pages/${pageId}`),
    enabled: !!pageId,
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
  parentPageId?: string;
}

export function useCreatePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreatePageInput) => {
      const id = uuid();
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
    onSuccess: (_page, input) => {
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
