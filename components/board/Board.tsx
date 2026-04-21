"use client";

import { AnimatePresence, LayoutGroup, type PanInfo } from "framer-motion";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { Column } from "./Column";
import { Icon } from "@/components/primitives/Icon";
import {
  useBoards,
  useCards,
  useColumns,
  useCreateBoard,
  useCreateColumn,
} from "@/lib/queries/boards";
import { useCardEditor } from "@/lib/store/cardEditor";
import { useCreateCard, useMoveCard } from "@/lib/queries/cards";
import { useBoardRealtime } from "@/lib/supabase/realtime";
import type { Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface BoardProps {
  projectId: string;
}

/**
 * Kanban board with Framer Motion drag.
 *
 * Clipping fix: the board root and each column's scroll wrapper switch to
 * `overflow: visible` while a card is being dragged. This lets the dragged
 * card float over neighbouring columns (via z-index) without being cut off
 * by the horizontal scroll container or the column's vertical scroll.
 * When drag ends, overflow snaps back so scrolling works normally.
 */
export function Board({ projectId }: BoardProps) {
  const boards = useBoards(projectId);
  const firstBoardId = boards.data?.[0]?.id;
  const columns = useColumns(firstBoardId);
  const cards = useCards(firstBoardId);
  const createCard = useCreateCard();
  const createBoard = useCreateBoard();
  const createColumn = useCreateColumn();
  const moveCard = useMoveCard();
  const openCardEditor = useCardEditor((s) => s.open);

  const [hoverColumn, setHoverColumn] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
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

  const onCardDragStart = useCallback((cardId: string) => {
    setDraggingId(cardId);
    setHoverColumn(null);
  }, []);

  const onCardDrag = useCallback(
    (_cardId: string, info: PanInfo) => {
      const hit = columnAtPoint(info.point.x, info.point.y);
      setHoverColumn((prev) => (prev === hit ? prev : hit));
    },
    [columnAtPoint],
  );

  const onCardDragEnd = useCallback(
    (cardId: string, info: PanInfo) => {
      setDraggingId(null);
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

  const DEFAULT_COLS: { name: string; state: string }[] = [
    { name: "Backlog", state: "backlog" },
    { name: "To do", state: "todo" },
    { name: "In progress", state: "in_progress" },
    { name: "In review", state: "in_review" },
    { name: "Done", state: "done" },
  ];

  async function bootstrap() {
    if (!projectId) return;
    let boardId = firstBoardId;
    if (!boardId) {
      const board = await createBoard.mutateAsync({ projectId, name: "Main" });
      boardId = board.id;
    }
    for (const { name, state } of DEFAULT_COLS) {
      await createColumn.mutateAsync({ boardId, name, default_workflow_state: state });
    }
  }

  async function addColumn() {
    const name = window.prompt("Column name", "New column")?.trim();
    if (!name) return;
    let boardId = firstBoardId;
    if (!boardId) {
      const board = await createBoard.mutateAsync({ projectId, name: "Main" });
      boardId = board.id;
    }
    await createColumn.mutateAsync({ boardId, name });
  }

  if (boards.isLoading) {
    return <BoardSkeleton />;
  }
  if (!firstBoardId || (columns.data?.length ?? 0) === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-surface-raised p-8 text-center shadow-1">
          <div className="mb-1 font-display text-[22px] font-semibold text-fg-1">
            Set up this board
          </div>
          <div className="mb-5 text-[13px] text-fg-3">
            We'll drop in five standard columns — Backlog through Done — so you
            can start working immediately.
          </div>
          <button
            type="button"
            onClick={bootstrap}
            disabled={createBoard.isPending || createColumn.isPending}
            className="inline-flex h-10 items-center justify-center rounded-md bg-accent px-4 text-[13px] font-medium text-fg-on-accent shadow-1 transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {createBoard.isPending || createColumn.isPending
              ? "Creating…"
              : "Create default columns"}
          </button>
          <div className="mt-3">
            <button
              type="button"
              onClick={addColumn}
              className="text-[12px] font-medium text-fg-3 hover:text-fg-1"
            >
              Or add one column at a time
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDragging = !!draggingId;

  return (
    <div
      ref={boardRef}
      className={cn(
        "flex h-full min-h-0 gap-4 pb-4",
        isDragging
          ? "overflow-visible"
          : "atlas-board-scroll overflow-x-auto overflow-y-hidden",
      )}
    >
      <LayoutGroup>
        <AnimatePresence initial={false}>
          {(columns.data ?? []).map((col) => (
            <Column
              key={col.id}
              column={col}
              cards={byColumn.get(col.id) ?? []}
              boardId={firstBoardId}
              isDragging={isDragging}
              isDropTarget={hoverColumn === col.id}
              onAddCard={(columnId) =>
                createCard.mutate({
                  boardId: firstBoardId,
                  columnId,
                  title: "New card",
                })
              }
              onEditCard={(card) => openCardEditor(card.id)}
              onCardDragStart={onCardDragStart}
              onCardDrag={onCardDrag}
              onCardDragEnd={onCardDragEnd}
            />
          ))}
        </AnimatePresence>
        <button
          type="button"
          onClick={addColumn}
          className="flex h-11 w-[260px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong bg-transparent text-[12.5px] font-medium text-fg-3 transition-colors hover:border-accent hover:bg-accent-tint hover:text-accent"
        >
          <Icon icon={Plus} size={13} /> Add column
        </button>
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
