"use client";

import { Link as LinkIcon } from "lucide-react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/primitives/Icon";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Card as CardType, WorkflowState } from "@/lib/types";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "drag"> {
  card: CardType;
  linkCount?: number;
  assignees?: { name: string }[];
  /** If true, the card is being dragged — apply translucent ghost style. */
  ghost?: boolean;
  /** If true, the card is the active DragOverlay clone — apply lift/tilt. */
  overlay?: boolean;
  /** If true, card is in edit-hover state (for the actual edit tap). */
  draggable?: boolean;
}

type TagTone = "indigo" | "apricot" | "sage" | "amber" | "persimmon" | "neutral";

const TAG_TONES: Record<TagTone, string> = {
  indigo: "bg-accent-tint text-accent",
  apricot: "bg-[var(--apricot-300)] text-[var(--apricot-600)]",
  sage: "bg-[var(--sage-100)] text-[var(--sage-500)]",
  amber: "bg-[var(--amber-100)] text-[var(--amber-500)]",
  persimmon: "bg-[var(--persimmon-100)] text-[var(--persimmon-500)]",
  neutral: "bg-surface-2 text-fg-3",
};

function stateTone(s: WorkflowState): TagTone {
  switch (s) {
    case "todo":
      return "indigo";
    case "in_progress":
      return "amber";
    case "in_review":
      return "apricot";
    case "done":
      return "sage";
    case "canceled":
      return "persimmon";
    default:
      return "neutral";
  }
}

function stateLabel(s: WorkflowState): string {
  return {
    backlog: "Backlog",
    todo: "To do",
    in_progress: "In progress",
    in_review: "In review",
    done: "Done",
    canceled: "Canceled",
  }[s];
}

function dueLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { card, ghost = false, overlay = false, linkCount = 0, assignees = [], className, ...props },
  ref,
) {
  const tagTone = stateTone(card.workflow_state);
  return (
    <motion.div
      ref={ref}
      whileHover={overlay ? undefined : { y: -1 }}
      transition={SPRING.gentle}
      data-card-id={card.id}
      dir="auto"
      className={cn(
        "relative overflow-hidden rounded-md bg-surface-raised px-3.5 pt-[11px] pb-2.5 shadow-1 select-none",
        overlay &&
          "rotate-[1.2deg] scale-[1.035] shadow-[0_24px_60px_-10px_rgba(0,0,0,0.35)] ring-1 ring-accent/40",
        ghost && "opacity-30",
        !overlay && !ghost && "cursor-grab active:cursor-grabbing",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "mb-1.5 inline-flex items-center rounded-xs px-1.5 py-px font-ui text-[10.5px] font-semibold",
          TAG_TONES[tagTone],
        )}
      >
        {stateLabel(card.workflow_state)}
      </div>
      <div className="font-ui text-[13.5px] font-medium leading-[1.35] text-fg-1">{card.title}</div>
      {card.description && (
        <div className="mt-1 line-clamp-2 font-ui text-[12.5px] leading-[1.45] text-fg-3">
          {card.description}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-fg-3">
        <div className="flex items-center gap-2">
          {card.due_at && <span>{dueLabel(card.due_at)}</span>}
          {linkCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Icon icon={LinkIcon} size={11} />
              {linkCount}
            </span>
          )}
        </div>
        {assignees.length > 0 && (
          <div className="flex items-center -space-x-1">
            {assignees.slice(0, 3).map((a) => (
              <Avatar key={a.name} name={a.name} size="xs" className="ring-1 ring-surface-raised" />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});
