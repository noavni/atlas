"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Card } from "./Card";
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

export interface BoardProps {
  projectId: string;
}

/**
 * Kanban board. Drag/drop powered by @dnd-kit — DragOverlay portals the
 * drag visual to <body>, so the dragged card is never clipped by the
 * Board's horizontal scroll container or any column's overflow.
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

  const [activeId, setActiveId] = useState<string | null>(null);

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

  const activeCard = useMemo(
    () => (cards.data ?? []).find((c) => c.id === activeId) ?? null,
    [cards.data, activeId],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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

  const findContainer = useCallback(
    (id: string): string | null => {
      if (id.startsWith("col:")) return id.slice(4);
      // Look up which column the card currently lives in (from cards list)
      const c = (cards.data ?? []).find((x) => x.id === id);
      return c?.column_id ?? null;
    },
    [cards.data],
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function onDragOver(_e: DragOverEvent) {
    // Cross-column move happens on drag-end; we don't speculatively mutate
    // here because the optimistic moveCard mutation would fire repeatedly.
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over || !firstBoardId) return;
    const cardId = active.id as string;
    const sourceColumnId = findContainer(cardId);
    if (!sourceColumnId) return;

    const overId = over.id as string;
    let targetColumnId: string | null = null;
    let overCardId: string | null = null;
    if (overId.startsWith("col:")) {
      targetColumnId = overId.slice(4);
    } else {
      targetColumnId = findContainer(overId);
      overCardId = overId;
    }
    if (!targetColumnId) return;

    const destCards = byColumn.get(targetColumnId) ?? [];
    let before: string | null = null;
    let after: string | null = null;
    if (!overCardId || sourceColumnId !== targetColumnId) {
      // Dropped on column whitespace or moving to a new column — append.
      const tail = destCards.at(-1);
      before = tail?.rank ?? null;
    } else {
      const idx = destCards.findIndex((c) => c.id === overCardId);
      if (idx === -1) {
        const tail = destCards.at(-1);
        before = tail?.rank ?? null;
      } else {
        const prev = destCards[idx - 1];
        const curr = destCards[idx];
        before = prev?.rank ?? null;
        after = curr?.rank ?? null;
        // When moving within the same column, don't sandwich the card
        // against itself.
        if (curr?.id === cardId) return;
      }
    }

    const card = (cards.data ?? []).find((c) => c.id === cardId);
    if (!card) return;
    if (sourceColumnId === targetColumnId && before === null && after === null) return;

    moveCard.mutate({
      boardId: firstBoardId,
      cardId,
      columnId: targetColumnId,
      before,
      after,
      version: card.version,
    });
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="atlas-board-scroll flex h-full min-h-0 gap-4 overflow-x-auto overflow-y-hidden pb-4">
        {(columns.data ?? []).map((col) => (
          <Column
            key={col.id}
            column={col}
            cards={byColumn.get(col.id) ?? []}
            activeCardId={activeId}
            onAddCard={(columnId) =>
              createCard.mutate({
                boardId: firstBoardId,
                columnId,
                title: "New card",
              })
            }
            onEditCard={(card) => openCardEditor(card.id)}
          />
        ))}
        <button
          type="button"
          onClick={addColumn}
          className="flex h-11 w-[260px] shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong bg-transparent text-[12.5px] font-medium text-fg-3 transition-colors hover:border-accent hover:bg-accent-tint hover:text-accent"
        >
          <Icon icon={Plus} size={13} /> Add column
        </button>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? <Card card={activeCard} overlay className="w-[280px]" /> : null}
      </DragOverlay>
    </DndContext>
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
