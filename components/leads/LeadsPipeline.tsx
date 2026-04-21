"use client";

import { ArrowRight } from "lucide-react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { LeadAvatar } from "./LeadAvatar";
import { formatMoney, PIPELINE_ORDER, STAGE_LABEL, STAGE_PILL } from "@/lib/leads";
import { SPRING } from "@/lib/motion";
import type { Lead, LeadStage } from "@/lib/types";
import { useMoveLead } from "@/lib/queries/leads";
import { cn } from "@/lib/utils";

interface Props {
  leads: Lead[];
  workspaceId: string;
  onSelect: (lead: Lead) => void;
}

export function LeadsPipeline({ leads, workspaceId, onSelect }: Props) {
  const move = useMoveLead();
  const [hoverStage, setHoverStage] = useState<LeadStage | null>(null);

  const byStage = useMemo(() => {
    const out = new Map<LeadStage, Lead[]>();
    PIPELINE_ORDER.forEach((s) => out.set(s, []));
    for (const l of leads) {
      const arr = out.get(l.stage) ?? [];
      arr.push(l);
      out.set(l.stage, arr);
    }
    for (const [k, v] of out) {
      out.set(
        k,
        [...v].sort((a, b) => (a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0)),
      );
    }
    return out;
  }, [leads]);

  const onDragEnd = useCallback(
    (lead: Lead) => {
      if (!hoverStage || hoverStage === lead.stage) return;
      const tail = (byStage.get(hoverStage) ?? []).at(-1);
      move.mutate({
        workspaceId,
        leadId: lead.id,
        stage: hoverStage,
        before: tail?.rank ?? null,
        after: null,
      });
      setHoverStage(null);
    },
    [hoverStage, byStage, move, workspaceId],
  );

  return (
    <div className="atlas-board-scroll flex h-full min-h-0 gap-4 overflow-x-auto overflow-y-hidden px-10 pb-10 pt-3">
      <LayoutGroup>
        {PIPELINE_ORDER.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const total = items.reduce((s, l) => s + (l.value_cents || 0), 0);
          const meta = STAGE_PILL[stage];
          const isDrop = hoverStage === stage;
          return (
            <motion.div
              key={stage}
              layout
              onPointerEnter={() => setHoverStage(stage)}
              className={cn(
                "flex h-full w-[280px] shrink-0 flex-col rounded-xl bg-surface-2 p-2.5",
                "transition-[background-color,box-shadow] duration-200",
                isDrop && "bg-accent-tint shadow-[inset_0_0_0_2px_var(--accent-primary)]",
              )}
            >
              <div className="flex items-center gap-2 px-2 pb-1.5 pt-1">
                <span
                  className={cn("h-2.5 w-2.5 rounded-full shadow-1", meta.dot)}
                  aria-hidden="true"
                />
                <span className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-fg-1">
                  {STAGE_LABEL[stage]}
                </span>
                <span className="ms-auto text-[11.5px] font-medium text-fg-3">{items.length}</span>
              </div>
              <div className="mb-2 flex items-center justify-between px-2 font-mono text-[11.5px] text-fg-3">
                <span>Total</span>
                <b className="font-semibold text-fg-1">{formatMoney(total)}</b>
              </div>
              <motion.div layout transition={SPRING.gentle} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                <AnimatePresence initial={false}>
                  {items.map((lead) => (
                    <motion.div
                      key={lead.id}
                      layout
                      layoutId={`pipe-${lead.id}`}
                      drag
                      dragMomentum={false}
                      dragElastic={0.18}
                      whileDrag={{ scale: 1.04, rotate: 1.5, zIndex: 10, boxShadow: "var(--shadow-3)" }}
                      whileHover={{ y: -1 }}
                      transition={SPRING.gentle}
                      onDragEnd={() => onDragEnd(lead)}
                      onClick={() => onSelect(lead)}
                      className="cursor-pointer rounded-[10px] bg-surface-raised p-3 shadow-1 select-none"
                      style={{ touchAction: "none", willChange: "transform" }}
                    >
                      <div className="flex items-center gap-2">
                        <LeadAvatar lead={lead} size={22} />
                        <div className="truncate text-[12.5px] font-semibold text-fg-1">
                          {lead.name}
                        </div>
                      </div>
                      <div className="mt-1 truncate text-[11.5px] text-fg-3">
                        {[lead.role, lead.company].filter(Boolean).join(" · ")}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="font-mono text-[11.5px] font-semibold tabular-nums text-fg-1">
                          {formatMoney(lead.value_cents || 0)}
                        </span>
                        {lead.next_step && (
                          <span className="inline-flex items-center gap-1 truncate text-[10.5px] text-fg-3">
                            <span className="truncate">{lead.next_step}</span>
                            <Icon icon={ArrowRight} size={11} />
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
