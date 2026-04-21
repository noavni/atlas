"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";

export type InboxKind = "text" | "voice" | "image" | "url" | "file";
export type InboxStatus = "inbox" | "processing" | "processed" | "archived" | "trashed";

export interface InboxItem {
  id: string;
  workspace_id: string;
  user_id: string;
  kind: InboxKind;
  raw_text: string | null;
  transcript: string | null;
  attachments: Record<string, unknown>[];
  source: string | null;
  status: InboxStatus;
  organized_into_type: "page" | "card" | null;
  organized_into_id: string | null;
  captured_at: string;
  processed_at: string | null;
}

export function useInbox(workspaceId: string | undefined, status: InboxStatus = "inbox") {
  return useQuery({
    queryKey: ["inbox", workspaceId, status],
    queryFn: () =>
      apiFetch<InboxItem[]>(
        `/v1/inbox?workspace_id=${workspaceId}&status=${status}`,
      ),
    enabled: !!workspaceId,
  });
}

interface CaptureInput {
  workspaceId: string;
  kind?: InboxKind;
  raw_text?: string;
  source?: string;
  attachments?: Record<string, unknown>[];
}

export function useCapture() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CaptureInput) => {
      const key = uuid();
      return apiFetch<InboxItem>("/v1/inbox/capture", {
        method: "POST",
        idempotencyKey: `inbox.capture:${key}`,
        body: JSON.stringify({
          workspace_id: input.workspaceId,
          client_idempotency_key: key,
          kind: input.kind ?? "text",
          raw_text: input.raw_text,
          source: input.source ?? "web",
          attachments: input.attachments ?? [],
        }),
      });
    },
    onSuccess: (_item, input) => {
      qc.invalidateQueries({ queryKey: ["inbox", input.workspaceId] });
    },
  });
}

interface OrganizeArgs {
  itemId: string;
  workspaceId: string;
}

export function useArchiveInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: OrganizeArgs) =>
      apiFetch<InboxItem>(`/v1/inbox/${args.itemId}/archive`, {
        method: "POST",
        idempotencyKey: `inbox.archive:${args.itemId}`,
      }),
    onSuccess: (_item, args) => {
      qc.invalidateQueries({ queryKey: ["inbox", args.workspaceId] });
    },
  });
}

export function useTrashInbox() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: OrganizeArgs) =>
      apiFetch<InboxItem>(`/v1/inbox/${args.itemId}/trash`, {
        method: "POST",
        idempotencyKey: `inbox.trash:${args.itemId}`,
      }),
    onSuccess: (_item, args) => {
      qc.invalidateQueries({ queryKey: ["inbox", args.workspaceId] });
    },
  });
}

export function useConvertToNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: OrganizeArgs & { title?: string }) =>
      apiFetch<InboxItem>(`/v1/inbox/${args.itemId}/convert-to-note`, {
        method: "POST",
        idempotencyKey: `inbox.to-note:${args.itemId}`,
        body: JSON.stringify({ title: args.title }),
      }),
    onSuccess: (_item, args) => {
      qc.invalidateQueries({ queryKey: ["inbox", args.workspaceId] });
      qc.invalidateQueries({ queryKey: ["pages", args.workspaceId] });
    },
  });
}
