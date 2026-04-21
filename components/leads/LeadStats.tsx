"use client";

import { useMemo } from "react";
import { formatMoney } from "@/lib/leads";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  caption?: string;
  captionTone?: "sage" | "apricot" | "muted";
}

function StatCard({ label, value, caption, captionTone = "muted" }: StatCardProps) {
  const captionColor =
    captionTone === "sage"
      ? "text-[var(--sage-500)]"
      : captionTone === "apricot"
        ? "text-[var(--apricot-600)]"
        : "text-fg-3";
  return (
    <div className="flex flex-col gap-1">
      <div className="font-display text-[26px] font-semibold leading-[1] tracking-[-0.018em] text-fg-1">
        {value}
      </div>
      <div className="text-[11px] font-medium lowercase text-fg-3">{label}</div>
      {caption && <div className={cn("text-[11px] font-medium", captionColor)}>{caption}</div>}
    </div>
  );
}

export function LeadStats({ leads }: { leads: Lead[] }) {
  const stats = useMemo(() => {
    const active = leads.filter((l) => l.stage !== "won" && l.stage !== "lost");
    const pipelineCents = active.reduce((sum, l) => sum + (l.value_cents || 0), 0);
    const weekAgo = Date.now() - 7 * 86400 * 1000;
    const newThisWeek = active.filter(
      (l) => new Date(l.created_at).getTime() >= weekAgo,
    ).length;
    const valueThisWeek = active
      .filter((l) => new Date(l.created_at).getTime() >= weekAgo)
      .reduce((sum, l) => sum + (l.value_cents || 0), 0);
    const needFollowUp = active.filter((l) => {
      if (!l.last_touched_at) return true;
      return (Date.now() - new Date(l.last_touched_at).getTime()) > 48 * 3600 * 1000;
    }).length;
    const overdue = needFollowUp > 0 ? Math.max(1, Math.floor(needFollowUp / 2)) : 0;
    const closed = leads.filter((l) => l.stage === "won" || l.stage === "lost").length;
    const won = leads.filter((l) => l.stage === "won").length;
    const rate = closed ? Math.round((won / closed) * 100) : 0;
    return {
      active: active.length,
      newThisWeek,
      pipelineCents,
      valueThisWeek,
      needFollowUp,
      overdue,
      rate,
    };
  }, [leads]);

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-4 md:gap-7">
      <StatCard
        label="Active"
        value={String(stats.active)}
        caption={stats.newThisWeek ? `+${stats.newThisWeek} this week` : undefined}
        captionTone="sage"
      />
      <StatCard
        label="Pipeline value"
        value={formatMoney(stats.pipelineCents)}
        caption={stats.valueThisWeek ? `+${formatMoney(stats.valueThisWeek)} this week` : undefined}
        captionTone="sage"
      />
      <StatCard
        label="Need follow-up"
        value={String(stats.needFollowUp)}
        caption={stats.overdue ? `${stats.overdue} overdue` : "All caught up"}
        captionTone={stats.overdue ? "apricot" : "muted"}
      />
      <StatCard label="Close rate" value={`${stats.rate}%`} caption="90d" />
    </div>
  );
}
