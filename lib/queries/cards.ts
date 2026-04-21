"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";
import { between } from "@/lib/lexorank";
import type { Card, WorkflowState } from "@/lib/types";

interface CreateCardInput {
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  state?: WorkflowState;
}

export function useCreateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateCardInput) => {
      const id = uuid();
      const key = `card.create:${id}`;
      return apiFetch<Card>("/v1/cards", {
        method: "POST",
        idempotencyKey: key,
        body: JSON.stringify({
          id,
          column_id: input.columnId,
          title: input.title,
          description: input.description,
          workflow_state: input.state,
        }),
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["cards", input.boardId] });
      const prev = qc.getQueryData<Card[]>(["cards", input.boardId]) ?? [];
      const tail = prev
        .filter((c) => c.column_id === input.columnId)
        .sort((a, b) => (a.rank < b.rank ? -1 : 1))
        .at(-1);
      const optimistic: Card = {
        id: uuid(),
        workspace_id: "",
        project_id: "",
        board_id: input.boardId,
        column_id: input.columnId,
        title: input.title,
        description: input.description ?? null,
        workflow_state: input.state ?? "todo",
        rank: between(tail?.rank, null),
        assignee_id: null,
        due_at: null,
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<Card[]>(["cards", input.boardId], [...prev, optimistic]);
      return { prev, optimisticId: optimistic.id };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cards", input.boardId], ctx.prev);
    },
    onSettled: (_data, _err, input) => {
      qc.invalidateQueries({ queryKey: ["cards", input.boardId] });
    },
  });
}

interface MoveCardInput {
  boardId: string;
  cardId: string;
  columnId: string;
  before: string | null;
  after: string | null;
  version: number;
}

export function useMoveCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: MoveCardInput) =>
      apiFetch<Card>(`/v1/cards/${input.cardId}/rank`, {
        method: "POST",
        idempotencyKey: `card.rank:${input.cardId}:${input.version}`,
        body: JSON.stringify({
          column_id: input.columnId,
          before: input.before,
          after: input.after,
          version: input.version,
        }),
      }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["cards", input.boardId] });
      const prev = qc.getQueryData<Card[]>(["cards", input.boardId]) ?? [];
      const newRank = between(input.before, input.after);
      const next = prev.map((c) =>
        c.id === input.cardId ? { ...c, column_id: input.columnId, rank: newRank } : c,
      );
      qc.setQueryData<Card[]>(["cards", input.boardId], next);
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cards", input.boardId], ctx.prev);
    },
    onSuccess: (card, input) => {
      const curr = qc.getQueryData<Card[]>(["cards", input.boardId]) ?? [];
      qc.setQueryData<Card[]>(
        ["cards", input.boardId],
        curr.map((c) => (c.id === card.id ? card : c)),
      );
    },
  });
}

interface UpdateCardInput {
  boardId: string;
  cardId: string;
  version: number;
  title?: string;
  description?: string;
  workflow_state?: WorkflowState;
}

export function useUpdateCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateCardInput) => {
      const { boardId, cardId, ...rest } = input;
      void boardId;
      return apiFetch<Card>(`/v1/cards/${cardId}`, {
        method: "PATCH",
        idempotencyKey: `card.update:${cardId}:${rest.version}`,
        body: JSON.stringify(rest),
      });
    },
    onSuccess: (card, input) => {
      const curr = qc.getQueryData<Card[]>(["cards", input.boardId]) ?? [];
      qc.setQueryData<Card[]>(
        ["cards", input.boardId],
        curr.map((c) => (c.id === card.id ? card : c)),
      );
    },
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId }: { boardId: string; cardId: string }) => {
      await apiFetch(`/v1/cards/${cardId}`, {
        method: "DELETE",
        idempotencyKey: `card.delete:${cardId}`,
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["cards", input.boardId] });
      const prev = qc.getQueryData<Card[]>(["cards", input.boardId]) ?? [];
      qc.setQueryData<Card[]>(
        ["cards", input.boardId],
        prev.filter((c) => c.id !== input.cardId),
      );
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["cards", input.boardId], ctx.prev);
    },
  });
}
