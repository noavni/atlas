"use client";

import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "./Card";
import { Icon } from "@/components/primitives/Icon";
import type { BoardColumn, Card as CardType } from "@/lib/types";
import { cn } from "@/lib/utils";

const stateDot: Record<CardType["workflow_state"], string> = {
  backlog: "bg-[var(--fg-4)]",
  todo: "bg-accent",
  in_progress: "bg-[var(--amber-500)]",
  in_review: "bg-[var(--amber-500)]",
  done: "bg-[var(--sage-500)]",
  canceled: "bg-[var(--fg-4)]",
};

export interface ColumnProps {
  column: BoardColumn;
  cards: CardType[];
  isDropTarget?: boolean;
  activeCardId?: string | null;
  onAddCard?: (columnId: string) => void;
  onEditCard?: (card: CardType) => void;
}

function SortableCard({
  card,
  isActiveDragging,
  onClick,
}: {
  card: CardType;
  isActiveDragging: boolean;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: transition ?? "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
  } as const;
  // `isDragging` from useSortable is true only while the pointer is actively
  // moving this node. We use `isActiveDragging` (the parent-provided active
  // id match) to keep the placeholder visible for the whole drag duration.
  const ghost = isDragging || isActiveDragging;
  return (
    <div ref={setNodeRef} style={style}>
      <Card
        card={card}
        ghost={ghost}
        {...listeners}
        {...attributes}
        onClick={(e) => {
          // Only fire the edit open when drag didn't move
          if (!isDragging && onClick) onClick();
          (listeners as unknown as { onClick?: (e: unknown) => void } | undefined)?.onClick?.(e);
        }}
      />
    </div>
  );
}

export function Column({
  column,
  cards,
  isDropTarget,
  activeCardId,
  onAddCard,
  onEditCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${column.id}`,
    data: { columnId: column.id, type: "column" },
  });
  const dotKey = column.default_workflow_state ?? "todo";
  const drop = isDropTarget || isOver;
  return (
    <motion.div
      data-column-id={column.id}
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col rounded-md p-2.5",
        "bg-surface-2 transition-[background-color,box-shadow] duration-200",
        drop && "bg-accent-tint shadow-[inset_0_0_0_2px_var(--accent-primary)]",
      )}
    >
      <div className="flex items-center gap-2 px-2 pb-2 pt-1 text-[13px] font-semibold">
        <span className={cn("h-2.5 w-2.5 rounded-full shadow-1", stateDot[dotKey])} aria-hidden="true" />
        <span className="text-fg-1">{column.name}</span>
        <span className="ms-auto text-[12px] font-medium text-fg-3">{cards.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="atlas-board-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-visible"
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              isActiveDragging={activeCardId === card.id}
              onClick={() => onEditCard?.(card)}
            />
          ))}
          {cards.length === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border-subtle px-3 py-8 text-center text-[11.5px] text-fg-4">
              Drop a card here
            </div>
          )}
        </SortableContext>
      </div>
      <button
        type="button"
        onClick={() => onAddCard?.(column.id)}
        className={cn(
          "mt-2 flex items-center gap-1.5 rounded-sm bg-transparent px-3 py-2 text-start",
          "font-ui text-[12.5px] font-medium text-fg-3",
          "transition-[background-color,color] duration-150 hover:bg-surface-hover hover:text-fg-1",
        )}
      >
        <Icon icon={Plus} size={14} />
        <span>Add card</span>
      </button>
    </motion.div>
  );
}
