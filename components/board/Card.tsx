"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import type { Card as CardType } from "@/lib/types";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "drag"> {
  card: CardType;
  isDragging?: boolean;
  draggable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { card, isDragging, draggable = true, className, ...props },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      layout="position"
      drag={draggable ? true : false}
      dragMomentum={false}
      whileDrag={{ scale: 1.015, boxShadow: "var(--shadow-3)", cursor: "grabbing" }}
      className={cn(
        "group relative select-none rounded-md bg-surface-raised px-3.5 py-3 shadow-1",
        "transition-[transform,box-shadow] duration-200",
        "hover:-translate-y-[1.5px] hover:shadow-2",
        isDragging ? "opacity-70" : "",
        draggable ? "cursor-grab active:cursor-grabbing" : "",
        className,
      )}
      {...props}
    >
      <div className="font-ui text-[13.5px] font-medium leading-[1.35] text-fg-1">{card.title}</div>
      {card.description && (
        <div className="mt-1.5 line-clamp-2 text-[12.5px] leading-[1.45] text-fg-3">
          {card.description}
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-fg-3">
        <span className="rounded-full bg-surface-2 px-1.5 py-px">{stateLabel(card.workflow_state)}</span>
      </div>
    </motion.div>
  );
});

function stateLabel(s: CardType["workflow_state"]) {
  switch (s) {
    case "backlog":
      return "Backlog";
    case "todo":
      return "Todo";
    case "in_progress":
      return "In progress";
    case "in_review":
      return "In review";
    case "done":
      return "Done";
    case "canceled":
      return "Canceled";
  }
}
