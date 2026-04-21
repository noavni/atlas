"use client";

import { ArrowRight } from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  type PanInfo,
} from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { LeadAvatar } from "./LeadAvatar";
import { PIPELINE_ORDER, STAGE_LABEL, STAGE_PILL } from "@/lib/leads";
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
  const [dragging, setDragging] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

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

  const stageAtPoint = useCallback((x: number, y: number): LeadStage | null => {
    const root = boardRef.current;
    if (!root) return null;
    const cols = root.querySelectorAll<HTMLElement>("[data-stage]");
    for (const el of cols) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return el.getAttribute("data-stage") as LeadStage;
      }
    }
    return null;
  }, []);

  const onDrag = useCallback(
    (info: PanInfo) => {
      const hit = stageAtPoint(info.point.x, info.point.y);
      setHoverStage((prev) => (prev === hit ? prev : hit));
    },
    [stageAtPoint],
  );

  const onDragEnd = useCallback(
    (lead: Lead, info: PanInfo) => {
      setDragging(null);
      setHoverStage(null);
      const target = stageAtPoint(info.point.x, info.point.y);
      if (!target || target === lead.stage) return;
      const tail = (byStage.get(target) ?? []).at(-1);
      move.mutate({
        workspaceId,
        leadId: lead.id,
        stage: target,
        before: tail?.rank ?? null,
        after: null,
      });
    },
    [byStage, move, workspaceId, stageAtPoint],
  );

  return (
    <div
      ref={boardRef}
      className={cn(
        "atlas-board-scroll flex h-full min-h-0 gap-5 overflow-x-auto px-10 pb-10 pt-3",
        dragging ? "overflow-y-visible" : "overflow-y-hidden",
      )}
    >
      <LayoutGroup>
        {PIPELINE_ORDER.map((stage) => {
          const items = byStage.get(stage) ?? [];
          const meta = STAGE_PILL[stage];
          const isDrop = hoverStage === stage;
          return (
            <motion.div
              key={stage}
              layout
              data-stage={stage}
              className={cn(
                "flex h-full w-[320px] shrink-0 flex-col rounded-xl bg-surface-2 p-3",
                "transition-[background-color,box-shadow] duration-200",
                isDrop &&
                  "bg-accent-tint shadow-[inset_0_0_0_2px_var(--accent-primary)]",
              )}
            >
              <div className="flex flex-none items-center gap-2 px-1 pb-3">
                <span
                  className={cn("h-2.5 w-2.5 rounded-full shadow-1", meta.dot)}
                  aria-hidden="true"
                />
                <span className="text-[12.5px] font-semibold uppercase tracking-[0.04em] text-fg-1">
                  {STAGE_LABEL[stage]}
                </span>
                <span className="ms-auto text-[11.5px] font-medium text-fg-3">
                  {items.length}
                </span>
              </div>

              <div
                className={cn(
                  "flex min-h-0 flex-1 flex-col gap-2",
                  // Only clip scroll when NOT dragging, so the dragged card
                  // floats above neighbouring columns instead of being
                  // clipped by overflow: auto.
                  dragging ? "overflow-visible" : "atlas-board-scroll overflow-y-auto",
                )}
              >
                {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border-subtle px-3 py-8 text-center text-[11.5px] text-fg-4">
                    Drop a lead here
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {items.map((lead) => {
                      const isDragging = dragging === lead.id;
                      return (
                        <motion.div
                          key={lead.id}
                          layout
                          layoutId={`pipe-${lead.id}`}
                          drag
                          dragMomentum={false}
                          dragElastic={0.12}
                          dragSnapToOrigin
                          onDragStart={() => setDragging(lead.id)}
                          onDrag={(_, info) => onDrag(info)}
                          onDragEnd={(_, info) => onDragEnd(lead, info)}
                          whileDrag={{
                            scale: 1.04,
                            rotate: 1.2,
                            boxShadow: "var(--shadow-3)",
                            cursor: "grabbing",
                          }}
                          whileHover={{ y: -1 }}
                          transition={SPRING.gentle}
                          onClick={() => !isDragging && onSelect(lead)}
                          style={{
                            touchAction: "none",
                            willChange: "transform",
                            zIndex: isDragging ? 60 : 1,
                            position: "relative",
                          }}
                          className="cursor-grab select-none rounded-[10px] bg-surface-raised p-3 shadow-1 active:cursor-grabbing"
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
                          {lead.next_step && (
                            <div className="mt-2 inline-flex items-center gap-1 truncate text-[10.5px] text-fg-3">
                              <span className="truncate">{lead.next_step}</span>
                              <Icon icon={ArrowRight} size={11} />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          );
        })}
      </LayoutGroup>
    </div>
  );
}
