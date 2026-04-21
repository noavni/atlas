"use client";

import { useQuery } from "@tanstack/react-query";
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
