"use client";

import { Check } from "lucide-react";
import { Icon } from "@/components/primitives/Icon";
import { STAGE_BAR_ORDER, STAGE_LABEL } from "@/lib/leads";
import type { LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StageBar({
  current,
  onPick,
}: {
  current: LeadStage;
  onPick?: (s: LeadStage) => void;
}) {
  const currentIdx = Math.max(0, STAGE_BAR_ORDER.indexOf(current === "lost" ? "new" : current));

  return (
    <div className="flex items-stretch gap-1.5 px-10 pb-6">
      {STAGE_BAR_ORDER.map((s, i) => {
        const done = i < currentIdx;
        const isCurrent = i === currentIdx && current !== "lost";
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick?.(s)}
            className={cn(
              "flex flex-1 flex-col items-start rounded-lg border px-3 py-2 text-start transition-[background-color,box-shadow,transform] duration-150",
              done
                ? "border-[color-mix(in_oklch,var(--sage-500)_30%,transparent)] bg-[color-mix(in_oklch,var(--sage-500)_12%,var(--surface-raised))] text-[var(--sage-500)]"
                : isCurrent
                  ? "border-transparent bg-accent text-fg-on-accent shadow-2"
                  : "border-border-subtle bg-surface-2 text-fg-3",
            )}
          >
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em]">
              {done && <Icon icon={Check} size={12} />}
              {STAGE_LABEL[s]}
            </div>
            <div
              className={cn(
                "mt-0.5 text-[10.5px]",
                done ? "text-[var(--sage-500)] opacity-80" : isCurrent ? "text-fg-on-accent opacity-80" : "text-fg-4",
              )}
            >
              {done ? "✓ done" : isCurrent ? "current" : "—"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
