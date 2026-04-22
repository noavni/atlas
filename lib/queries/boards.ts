"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";
import type { Board, BoardColumn, Card } from "@/lib/types";

// Long staleTime on board entities: realtime subscriptions push
// updates into the cache, so re-navigating back to a project does NOT
// need a fresh network round-trip. This is what makes clicking around
// the app feel instant — we serve cached data immediately and only
// revalidate in the background.
const BOARD_QUERY_OPTS = {
  staleTime: 5 * 60_000,
  gcTime: 30 * 60_000,
  refetchOnWindowFocus: false,
} as const;

export function useBoards(projectId: string | undefined) {
  return useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => apiFetch<Board[]>(`/v1/projects/${projectId}/boards`),
    enabled: !!projectId,
    ...BOARD_QUERY_OPTS,
  });
}

export function useColumns(boardId: string | undefined) {
  return useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => apiFetch<BoardColumn[]>(`/v1/boards/${boardId}/columns`),
    enabled: !!boardId,
    ...BOARD_QUERY_OPTS,
  });
}

export function useCards(boardId: string | undefined) {
  return useQuery({
    queryKey: ["cards", boardId],
    queryFn: () => apiFetch<Card[]>(`/v1/boards/${boardId}/cards`),
    enabled: !!boardId,
    ...BOARD_QUERY_OPTS,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, name }: { projectId: string; name: string }) => {
      const id = uuid();
      return apiFetch<Board>(`/v1/projects/${projectId}/boards`, {
        method: "POST",
        idempotencyKey: `board.create:${id}`,
        body: JSON.stringify({ id, name }),
      });
    },
    onSuccess: (_b, input) => {
      qc.invalidateQueries({ queryKey: ["boards", input.projectId] });
    },
  });
}

export function useCreateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      boardId,
      name,
      default_workflow_state,
    }: {
      boardId: string;
      name: string;
      default_workflow_state?: string;
    }) => {
      const id = uuid();
      return apiFetch<BoardColumn>(`/v1/boards/${boardId}/columns`, {
        method: "POST",
        idempotencyKey: `column.create:${id}`,
        body: JSON.stringify({ id, name, default_workflow_state }),
      });
    },
    onSuccess: (_c, input) => {
      qc.invalidateQueries({ queryKey: ["columns", input.boardId] });
    },
  });
}

export function useUpdateColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      columnId,
      name,
    }: {
      boardId: string;
      columnId: string;
      name: string;
    }) => {
      return apiFetch<BoardColumn>(`/v1/columns/${columnId}`, {
        method: "PATCH",
        idempotencyKey: `column.update:${columnId}:${Date.now()}`,
        body: JSON.stringify({ name }),
      });
    },
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: ["columns", input.boardId] });
      const prev = qc.getQueryData<BoardColumn[]>(["columns", input.boardId]) ?? [];
      qc.setQueryData<BoardColumn[]>(
        ["columns", input.boardId],
        prev.map((c) => (c.id === input.columnId ? { ...c, name: input.name } : c)),
      );
      return { prev };
    },
    onError: (_e, input, ctx) => {
      if (ctx?.prev) qc.setQueryData(["columns", input.boardId], ctx.prev);
    },
    onSettled: (_d, _e, input) => {
      qc.invalidateQueries({ queryKey: ["columns", input.boardId] });
    },
  });
}
