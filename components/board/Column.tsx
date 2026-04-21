"use client";

import { Plus } from "lucide-react";
import { motion, type PanInfo } from "framer-motion";
import { Card } from "./Card";
import { Icon } from "@/components/primitives/Icon";
import { SPRING } from "@/lib/motion";
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
  onAddCard?: (columnId: string) => void;
  onCardDragStart?: (cardId: string) => void;
  onCardDrag?: (cardId: string, info: PanInfo) => void;
  onCardDragEnd?: (cardId: string, info: PanInfo) => void;
}

export function Column({
  column,
  cards,
  isDropTarget,
  onAddCard,
  onCardDragStart,
  onCardDrag,
  onCardDragEnd,
}: ColumnProps) {
  const dotKey = column.default_workflow_state ?? "todo";
  return (
    <motion.div
      layout
      data-column-id={column.id}
      className={cn(
        "flex h-full w-[300px] shrink-0 flex-col rounded-md p-2.5",
        "bg-surface-2 transition-[background-color,box-shadow] duration-200",
        isDropTarget && "bg-accent-tint shadow-[inset_0_0_0_2px_var(--accent-primary)]",
      )}
    >
      <div className="flex items-center gap-2 px-2 pb-2 pt-1 text-[13px] font-semibold">
        <span className={cn("h-2.5 w-2.5 rounded-full shadow-1", stateDot[dotKey])} aria-hidden="true" />
        <span className="text-fg-1">{column.name}</span>
        <span className="ms-auto text-[12px] font-medium text-fg-3">{cards.length}</span>
      </div>
      <motion.div
        layout
        transition={SPRING.gentle}
        className="atlas-board-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
      >
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onCardDragStart={() => onCardDragStart?.(card.id)}
            onCardDrag={(info) => onCardDrag?.(card.id, info)}
            onCardDragEnd={(info) => onCardDragEnd?.(card.id, info)}
          />
        ))}
      </motion.div>
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
