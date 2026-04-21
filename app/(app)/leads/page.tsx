"use client";

import { Download, Filter, Plus, SortAsc, Users as UsersIcon } from "lucide-react";
import { useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/primitives/Button";
import { EmptyState } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";
import { LeadStats } from "@/components/leads/LeadStats";
import { LeadsPipeline } from "@/components/leads/LeadsPipeline";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadsTimeline } from "@/components/leads/LeadsTimeline";
import { useMe } from "@/lib/queries/me";
import { useLeads } from "@/lib/queries/leads";
import { useLeadsUI, type LeadView } from "@/lib/store/leads";
import { cn } from "@/lib/utils";
import type { Lead, LeadActivity } from "@/lib/types";

const VIEWS: { id: LeadView; label: string }[] = [
  { id: "table", label: "Table" },
  { id: "pipeline", label: "Pipeline" },
  { id: "timeline", label: "Timeline" },
];

export default function LeadsHubPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const leads = useLeads(workspaceId);
  const view = useLeadsUI((s) => s.view);
  const setView = useLeadsUI((s) => s.setView);
  const openDrawer = useLeadsUI((s) => s.openLeadDrawer);
  const setNewLeadOpen = useLeadsUI((s) => s.setNewLeadOpen);

  const allLeads = leads.data ?? [];

  const timelineActs = useMemo<LeadActivity[]>(() => {
    // The timeline stub: build from lead.last_touched + simulated events.
    return allLeads
      .filter((l) => l.last_touched_at)
      .map((l) => ({
        id: `${l.id}-touch`,
        lead_id: l.id,
        actor_id: null,
        kind: nextStepKindFor(l),
        headline: l.next_step || "Activity",
        detail: l.next_step || null,
        attrs: {},
        created_at: l.last_touched_at!,
      }));
  }, [allLeads]);

  const fullHeight = view === "pipeline";

  return (
    <AppShell crumbs={["Atlas", "Leads"]} fullHeight={fullHeight}>
      <div className={cn("flex min-h-0 flex-1 flex-col", !fullHeight && "h-full")}>
        <div className="border-b border-border-subtle px-10 pb-5 pt-8">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
            Relationships · Pipeline
          </div>
          <div className="flex items-end justify-between gap-4">
            <h1 className="m-0 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-fg-1">
              Leads
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="secondary" leadingIcon={<Icon icon={Download} size={13} />}>
                Export
              </Button>
              <Button
                variant="primary"
                leadingIcon={<Icon icon={Plus} size={13} />}
                onClick={() => setNewLeadOpen(true)}
              >
                New lead
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <LeadStats leads={allLeads} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-surface-app px-10 py-3.5">
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-2 p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={cn(
                  "rounded-md px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-150",
                  view === v.id
                    ? "bg-surface-raised text-fg-1 shadow-1"
                    : "text-fg-2 hover:text-fg-1",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" leadingIcon={<Icon icon={Filter} size={13} />}>
              Filter
            </Button>
            <Button variant="ghost" leadingIcon={<Icon icon={SortAsc} size={13} />}>
              Sort
            </Button>
          </div>
        </div>

        {leads.isLoading ? (
          <TableSkeleton />
        ) : allLeads.length === 0 ? (
          <EmptyState
            icon={<Icon icon={UsersIcon} size={28} />}
            title="No leads yet."
            hint="Press ⌘⇧L to add one."
          />
        ) : view === "table" ? (
          <LeadsTable leads={allLeads} onSelect={(l: Lead) => openDrawer(l.id)} />
        ) : view === "pipeline" ? (
          <LeadsPipeline
            leads={allLeads}
            workspaceId={workspaceId!}
            onSelect={(l) => openDrawer(l.id)}
          />
        ) : (
          <LeadsTimeline
            leads={allLeads}
            activities={timelineActs}
            onSelect={(l) => openDrawer(l.id)}
          />
        )}
      </div>
    </AppShell>
  );
}

function nextStepKindFor(l: Lead): LeadActivity["kind"] {
  if (l.stage === "proposal") return "email";
  if (l.stage === "qualified") return "call";
  if (l.stage === "won") return "stage";
  return "note";
}

function TableSkeleton() {
  return (
    <div className="px-10 pt-6">
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md border border-border-subtle bg-surface-raised p-3"
          >
            <div className="h-8 w-8 animate-pulse rounded-full bg-surface-2" />
            <div className="h-4 flex-1 animate-pulse rounded bg-surface-2" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
