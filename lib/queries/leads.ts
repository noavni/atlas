"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";
import { between } from "@/lib/lexorank";
import type { Lead, LeadActivity, LeadDetail, LeadStage, LeadTask } from "@/lib/types";

const STAGE_ORDER: LeadStage[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
export const PIPELINE_STAGES = STAGE_ORDER;

export function useLeads(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["leads", workspaceId],
    queryFn: () => apiFetch<Lead[]>(`/v1/workspaces/${workspaceId}/leads`),
    enabled: !!workspaceId,
    staleTime: 60_000,
  });
}

export function useLead(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead", leadId],
    queryFn: () => apiFetch<Lead>(`/v1/leads/${leadId}`),
    enabled: !!leadId,
  });
}

export function useLeadDetail(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-detail", leadId],
    queryFn: () => apiFetch<LeadDetail>(`/v1/leads/${leadId}/detail`),
    enabled: !!leadId,
    staleTime: 30_000,
  });
}

interface CreateLeadInput {
  workspaceId: string;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  stage?: LeadStage;
  value_cents?: number;
  tags?: string[];
  first_note?: string;
  avatar_color?: string;
  avatar_initials?: string;
  next_step?: string;
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const id = uuid();
      return apiFetch<Lead>(`/v1/workspaces/${input.workspaceId}/leads`, {
        method: "POST",
        idempotencyKey: `lead.create:${id}`,
        body: JSON.stringify({ id, ...input }),
      });
    },
    onSuccess: (_lead, input) => {
      qc.invalidateQueries({ queryKey: ["leads", input.workspaceId] });
    },
  });
}

export interface BulkLeadInput extends Omit<CreateLeadInput, "workspaceId"> {
  location?: string;
  linkedin_url?: string;
}

export function useBulkCreateLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workspaceId,
      leads,
    }: {
      workspaceId: string;
      leads: BulkLeadInput[];
    }) => {
      const created: Lead[] = [];
      for (const l of leads) {
        const id = uuid();
        const out = await apiFetch<Lead>(`/v1/workspaces/${workspaceId}/leads`, {
          method: "POST",
          idempotencyKey: `lead.create:${id}`,
          body: JSON.stringify({ id, ...l }),
        });
        created.push(out);
      }
      return created;
    },
    onSuccess: (_leads, input) => {
      qc.invalidateQueries({ queryKey: ["leads", input.workspaceId] });
    },
  });
}

interface UpdateLeadInput {
  leadId: string;
  workspaceId: string;
  patch: Partial<Pick<
    Lead,
    | "name"
    | "role"
    | "company"
    | "email"
    | "phone"
    | "location"
    | "source"
    | "stage"
    | "value_cents"
    | "tags"
    | "next_step"
  >>;
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, patch }: UpdateLeadInput) => {
      return apiFetch<Lead>(`/v1/leads/${leadId}`, {
        method: "PATCH",
        idempotencyKey: `lead.update:${leadId}:${Date.now()}`,
        body: JSON.stringify(patch),
      });
    },
    onMutate: async ({ leadId, workspaceId, patch }) => {
      await qc.cancelQueries({ queryKey: ["leads", workspaceId] });
      const prev = qc.getQueryData<Lead[]>(["leads", workspaceId]);
      if (prev) {
        qc.setQueryData<Lead[]>(
          ["leads", workspaceId],
          prev.map((l) => (l.id === leadId ? { ...l, ...patch } : l)),
        );
      }
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads", input.workspaceId], ctx.prev);
    },
    onSuccess: (lead) => {
      qc.setQueryData(["lead", lead.id], lead);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: ["lead-detail", input.leadId] });
    },
  });
}

interface MoveLeadInput {
  workspaceId: string;
  leadId: string;
  stage: LeadStage;
  before: string | null;
  after: string | null;
}

export function useMoveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MoveLeadInput) =>
      apiFetch<Lead>(`/v1/leads/${input.leadId}/rank`, {
        method: "POST",
        idempotencyKey: `lead.rank:${input.leadId}:${Date.now()}`,
        body: JSON.stringify({
          stage: input.stage,
          before: input.before,
          after: input.after,
        }),
      }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["leads", input.workspaceId] });
      const prev = qc.getQueryData<Lead[]>(["leads", input.workspaceId]);
      const newRank = between(input.before, input.after);
      if (prev) {
        qc.setQueryData<Lead[]>(
          ["leads", input.workspaceId],
          prev.map((l) =>
            l.id === input.leadId ? { ...l, stage: input.stage, rank: newRank } : l,
          ),
        );
      }
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["leads", input.workspaceId], ctx.prev);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: ["leads", input.workspaceId] });
    },
  });
}

export function useAddActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      leadId: string;
      kind: LeadActivity["kind"];
      headline: string;
      detail?: string;
    }) =>
      apiFetch<LeadActivity>(`/v1/leads/${input.leadId}/activities`, {
        method: "POST",
        idempotencyKey: `activity:${uuid()}`,
        body: JSON.stringify({
          kind: input.kind,
          headline: input.headline,
          detail: input.detail,
        }),
      }),
    onSuccess: (_a, input) => {
      qc.invalidateQueries({ queryKey: ["lead-detail", input.leadId] });
    },
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { leadId: string; task: LeadTask }) =>
      apiFetch<LeadTask>(`/v1/lead-tasks/${input.task.id}`, {
        method: "PATCH",
        idempotencyKey: `task:${input.task.id}:${Date.now()}`,
        body: JSON.stringify({ done: !input.task.done }),
      }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["lead-detail", input.leadId] });
      const prev = qc.getQueryData<LeadDetail>(["lead-detail", input.leadId]);
      if (prev) {
        qc.setQueryData<LeadDetail>(["lead-detail", input.leadId], {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === input.task.id ? { ...t, done: !t.done } : t,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["lead-detail", input.leadId], ctx.prev);
    },
  });
}
