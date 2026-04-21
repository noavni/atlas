"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "./client";

/**
 * Subscribe to row-level changes on a board's cards/columns and invalidate the
 * matching TanStack Query caches. Small hammer; refinements (merge row by row)
 * land if profiling calls for it.
 */
export function useBoardRealtime(boardId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!boardId) return;
    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards", filter: `board_id=eq.${boardId}` },
        () => qc.invalidateQueries({ queryKey: ["cards", boardId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "columns", filter: `board_id=eq.${boardId}` },
        () => qc.invalidateQueries({ queryKey: ["columns", boardId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, qc]);
}
