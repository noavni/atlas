"use client";

import { STAGE_LABEL, STAGE_PILL } from "@/lib/leads";
import { cn } from "@/lib/utils";
import type { LeadStage } from "@/lib/types";

export function StagePill({ stage, className }: { stage: LeadStage; className?: string }) {
  const s = STAGE_PILL[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-semibold",
        s.bg,
        s.fg,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {STAGE_LABEL[stage]}
    </span>
  );
}
