"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { v4 as uuid } from "uuid";
import { apiFetch } from "@/lib/api";
import type { Board, BoardColumn, Card } from "@/lib/types";

export function useBoards(projectId: string | undefined) {
  return useQuery({
    queryKey: ["boards", projectId],
    queryFn: () => apiFetch<Board[]>(`/v1/projects/${projectId}/boards`),
    enabled: !!projectId,
  });
}

export function useColumns(boardId: string | undefined) {
  return useQuery({
    queryKey: ["columns", boardId],
    queryFn: () => apiFetch<BoardColumn[]>(`/v1/boards/${boardId}/columns`),
    enabled: !!boardId,
  });
}

export function useCards(boardId: string | undefined) {
  return useQuery({
    queryKey: ["cards", boardId],
    queryFn: () => apiFetch<Card[]>(`/v1/boards/${boardId}/cards`),
    enabled: !!boardId,
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
