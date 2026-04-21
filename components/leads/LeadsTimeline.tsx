"use client";

import { ArrowRightCircle, FileText, Mail, Phone } from "lucide-react";
import { useMemo } from "react";
import { Icon } from "@/components/primitives/Icon";
import { LeadAvatar } from "./LeadAvatar";
import type { Lead, LeadActivity, LeadActivityKind } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  leads: Lead[];
  activities: LeadActivity[];
  onSelect: (lead: Lead) => void;
}

const ICON_BY_KIND: Record<LeadActivityKind, typeof Mail> = {
  email: Mail,
  call: Phone,
  note: FileText,
  stage: ArrowRightCircle,
  file: FileText,
  meeting: ArrowRightCircle,
};

const STYLE_BY_KIND: Record<LeadActivityKind, string> = {
  call: "bg-accent-tint text-accent",
  email: "bg-[var(--apricot-300)] text-[var(--apricot-600)]",
  note: "bg-[var(--sage-100)] text-[var(--sage-500)]",
  stage: "bg-[var(--amber-100)] text-[var(--amber-500)]",
  file: "bg-[var(--apricot-300)] text-[var(--apricot-600)]",
  meeting: "bg-accent-tint text-accent",
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function LeadsTimeline({ leads, activities, onSelect }: Props) {
  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l] as const)), [leads]);
  const groups = useMemo(() => {
    const out = new Map<string, LeadActivity[]>();
    for (const a of activities) {
      const key = dayLabel(a.created_at);
      (out.get(key) ?? out.set(key, []).get(key)!).push(a);
    }
    return out;
  }, [activities]);

  return (
    <div className="atlas-board-scroll flex-1 overflow-auto px-10 pb-10 pt-6">
      {Array.from(groups.entries()).map(([day, items]) => (
        <div key={day} className="mb-8">
          <div className="sticky top-0 z-10 mb-3 bg-surface-app pb-2 pt-1">
            <div className="font-display text-[22px] font-semibold tracking-[-0.015em] text-fg-1">
              {day}
            </div>
            <div className="text-[11.5px] text-fg-3">
              {items.length} {items.length === 1 ? "event" : "events"}
            </div>
          </div>
          <ul className="flex flex-col">
            {items.map((a) => {
              const lead = leadsById.get(a.lead_id);
              const KindIcon = ICON_BY_KIND[a.kind];
              return (
                <li
                  key={a.id}
                  className="grid grid-cols-[78px_40px_1fr] items-start gap-4 border-b border-border-subtle py-4"
                >
                  <div className="pt-2 font-mono text-[11.5px] tabular-nums text-fg-3">
                    {timeLabel(a.created_at)}
                  </div>
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border border-border-subtle",
                      STYLE_BY_KIND[a.kind],
                    )}
                  >
                    <Icon icon={KindIcon} size={14} />
                  </div>
                  <div className="min-w-0">
                    {lead && (
                      <div className="mb-1 flex items-center gap-2">
                        <LeadAvatar lead={lead} size={22} />
                        <button
                          type="button"
                          onClick={() => onSelect(lead)}
                          className="text-[13px] font-semibold text-fg-1 hover:text-accent"
                        >
                          {lead.name}
                        </button>
                        <span className="text-[12.5px] text-fg-2">· {a.headline}</span>
                      </div>
                    )}
                    {a.detail && (
                      <div className="font-serif text-[14.5px] leading-[1.5] text-fg-2">
                        {a.detail}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
