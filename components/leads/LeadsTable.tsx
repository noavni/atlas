"use client";

import { Calendar, Mail, MoreHorizontal, Phone } from "lucide-react";
import Link from "next/link";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { LeadAvatar } from "./LeadAvatar";
import { StagePill } from "./StagePill";
import { formatFullMoney, relativeTime } from "@/lib/leads";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  leads: Lead[];
  onSelect?: (lead: Lead) => void;
}

export function LeadsTable({ leads, onSelect }: Props) {
  return (
    <div className="atlas-board-scroll mt-3 overflow-x-auto px-10 pb-10">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <Th width="28%">Lead</Th>
            <Th width="14%">Stage</Th>
            <Th width="14%">Value</Th>
            <Th width="16%">Last touch</Th>
            <Th width="13%">Next step</Th>
            <Th width="15%">Tags</Th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="group cursor-pointer border-b border-border-subtle transition-colors duration-150 hover:bg-surface-hover"
              onClick={() => onSelect?.(lead)}
            >
              <td className="py-3.5 pe-4">
                <div className="flex items-center gap-3">
                  <LeadAvatar lead={lead} size={30} />
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold text-fg-1">
                      {lead.name}
                    </div>
                    <div className="truncate text-[11.5px] text-fg-3">
                      {[lead.role, lead.company].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-3.5">
                <StagePill stage={lead.stage} />
              </td>
              <td className="py-3.5 font-mono text-[12.5px] font-medium tabular-nums text-fg-1">
                {formatFullMoney(lead.value_cents || 0)}
              </td>
              <td className="py-3.5 text-[12.5px] text-fg-2">
                {relativeTime(lead.last_touched_at)}
              </td>
              <td className="py-3.5 text-[12.5px] text-fg-2">
                <span className="line-clamp-1">{lead.next_step || "—"}</span>
              </td>
              <td className="py-3.5">
                <div className="flex flex-wrap gap-1">
                  {lead.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-xs bg-surface-2 px-1.5 py-px text-[10.5px] font-medium text-fg-3"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="relative">
                <div
                  className={cn(
                    "pointer-events-none absolute inset-y-0 end-2 my-auto flex h-8 items-center gap-0.5 rounded-[9px] border border-border-subtle bg-surface-raised px-1 shadow-2 opacity-0 transition-opacity duration-150",
                    "group-hover:pointer-events-auto group-hover:opacity-100",
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {lead.email && (
                    <IconButton
                      size="sm"
                      title="Email"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `mailto:${lead.email}`;
                      }}
                    >
                      <Icon icon={Mail} size={13} />
                    </IconButton>
                  )}
                  {lead.phone && (
                    <IconButton
                      size="sm"
                      title="Call"
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `tel:${lead.phone}`;
                      }}
                    >
                      <Icon icon={Phone} size={13} />
                    </IconButton>
                  )}
                  <IconButton size="sm" title="Schedule">
                    <Icon icon={Calendar} size={13} />
                  </IconButton>
                  <Link href={`/leads/${lead.id}`} onClick={(e) => e.stopPropagation()}>
                    <IconButton size="sm" title="More">
                      <Icon icon={MoreHorizontal} size={13} />
                    </IconButton>
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, width }: { children: React.ReactNode; width: string }) {
  return (
    <th
      style={{ width }}
      className="sticky top-0 bg-surface-app px-0 py-2.5 pe-4 text-start text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3"
    >
      {children}
    </th>
  );
}
