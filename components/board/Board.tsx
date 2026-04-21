"use client";

import { AnimatePresence, LayoutGroup, type PanInfo } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { Column } from "./Column";
import {
  useBoards,
  useCards,
  useColumns,
} from "@/lib/queries/boards";
import { useCreateCard, useMoveCard } from "@/lib/queries/cards";
import { useBoardRealtime } from "@/lib/supabase/realtime";
import type { Card as CardType } from "@/lib/types";

export interface BoardProps {
  projectId: string;
}

/**
 * Phase 1 board. One board per project (the first). We resolve it, load its
 * columns + cards, render them, and wire drag-to-move via Framer Motion.
 *
 * Drag model: while dragging, we track the hovered column; on drag end we
 * compute the new neighbours and post the rank update. Optimistic state is
 * handled inside the useMoveCard mutation.
 */
export function Board({ projectId }: BoardProps) {
  const boards = useBoards(projectId);
  const firstBoardId = boards.data?.[0]?.id;
  const columns = useColumns(firstBoardId);
  const cards = useCards(firstBoardId);
  const createCard = useCreateCard();
  const moveCard = useMoveCard();

  const [hoverColumn, setHoverColumn] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useBoardRealtime(firstBoardId);

  const byColumn = useMemo(() => {
    const out = new Map<string, CardType[]>();
    (columns.data ?? []).forEach((c) => out.set(c.id, []));
    (cards.data ?? []).forEach((c) => {
      const list = out.get(c.column_id) ?? [];
      list.push(c);
      out.set(c.column_id, list);
    });
    for (const [k, v] of out) {
      out.set(
        k,
        [...v].sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0)),
      );
    }
    return out;
  }, [columns.data, cards.data]);

  const columnAtPoint = useCallback((x: number, y: number): string | null => {
    const root = boardRef.current;
    if (!root) return null;
    const cols = root.querySelectorAll<HTMLElement>("[data-column-id]");
    for (const el of cols) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return el.getAttribute("data-column-id");
      }
    }
    return null;
  }, []);

  const onCardDrag = useCallback(
    (_cardId: string, info: PanInfo) => {
      const hit = columnAtPoint(info.point.x, info.point.y);
      setHoverColumn((prev) => (prev === hit ? prev : hit));
    },
    [columnAtPoint],
  );

  const onCardDragStart = useCallback((_cardId: string) => {
    setHoverColumn(null);
  }, []);

  const onCardDragEnd = useCallback(
    (cardId: string, info: PanInfo) => {
      setHoverColumn(null);
      if (!firstBoardId) return;
      const target = columnAtPoint(info.point.x, info.point.y);
      if (!target) return;
      const card = (cards.data ?? []).find((c) => c.id === cardId);
      if (!card) return;
      if (card.column_id === target) return;
      const dest = byColumn.get(target) ?? [];
      const tail = dest.at(-1);
      moveCard.mutate({
        boardId: firstBoardId,
        cardId,
        columnId: target,
        before: tail?.rank ?? null,
        after: null,
        version: card.version,
      });
    },
    [firstBoardId, byColumn, cards.data, moveCard, columnAtPoint],
  );

  if (boards.isLoading || columns.isLoading || cards.isLoading) {
    return <BoardSkeleton />;
  }
  if (!firstBoardId) {
    return (
      <div className="flex items-center justify-center py-16 text-center text-fg-3">
        <div>
          <div className="mb-1 text-base text-fg-1">No boards yet.</div>
          <div className="text-sm">Create one — drag cards, hit “N” for a new card.</div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={boardRef}
      className="atlas-board-scroll flex h-full min-h-0 gap-4 overflow-x-auto overflow-y-hidden pb-4"
    >
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {(columns.data ?? []).map((col) => (
            <Column
              key={col.id}
              column={col}
              cards={byColumn.get(col.id) ?? []}
              isDropTarget={hoverColumn === col.id}
              onAddCard={(columnId) =>
                createCard.mutate({
                  boardId: firstBoardId,
                  columnId,
                  title: "New card",
                })
              }
              onCardDragStart={onCardDragStart}
              onCardDrag={onCardDrag}
              onCardDragEnd={onCardDragEnd}
            />
          ))}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex h-full gap-4 overflow-x-auto overflow-y-hidden pb-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[440px] w-[300px] shrink-0 animate-pulse rounded-md bg-surface-2"
        />
      ))}
    </div>
  );
}
