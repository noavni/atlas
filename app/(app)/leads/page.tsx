"use client";

import {
  Check,
  Plus,
  Search,
  SlidersHorizontal,
  SortAsc,
  Upload,
  Users as UsersIcon,
  X as XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { STAGE_LABEL } from "@/lib/leads";
import { cn } from "@/lib/utils";
import type { Lead, LeadActivity, LeadStage } from "@/lib/types";

const VIEWS: { id: LeadView; label: string }[] = [
  { id: "table", label: "Table" },
  { id: "pipeline", label: "Pipeline" },
  { id: "timeline", label: "Timeline" },
];

type SortKey = "recent" | "value" | "name" | "stage";
const SORT_LABEL: Record<SortKey, string> = {
  recent: "Last touched",
  value: "Value (high → low)",
  name: "Name (A → Z)",
  stage: "Stage",
};
const STAGE_RANK: Record<LeadStage, number> = {
  new: 0,
  contacted: 1,
  qualified: 2,
  proposal: 3,
  won: 4,
  lost: 5,
};

export default function LeadsHubPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const leads = useLeads(workspaceId);
  const view = useLeadsUI((s) => s.view);
  const setView = useLeadsUI((s) => s.setView);
  const openDrawer = useLeadsUI((s) => s.openLeadDrawer);
  const setNewLeadOpen = useLeadsUI((s) => s.setNewLeadOpen);
  const setImportOpen = useLeadsUI((s) => s.setImportOpen);
  const [query, setQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<Set<LeadStage>>(new Set());
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recent");
  const [stageMenu, setStageMenu] = useState(false);
  const [sortMenu, setSortMenu] = useState(false);
  const stageBtnRef = useRef<HTMLDivElement>(null);
  const sortBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (stageBtnRef.current && !stageBtnRef.current.contains(e.target as Node))
        setStageMenu(false);
      if (sortBtnRef.current && !sortBtnRef.current.contains(e.target as Node))
        setSortMenu(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const allLeads = leads.data ?? [];

  const availableTags = useMemo(() => {
    const seen = new Map<string, number>();
    for (const l of allLeads) {
      for (const t of l.tags) seen.set(t, (seen.get(t) ?? 0) + 1);
    }
    return Array.from(seen.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([t]) => t);
  }, [allLeads]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = allLeads.filter((l) => {
      if (stageFilter.size && !stageFilter.has(l.stage)) return false;
      if (tagFilter && !l.tags.includes(tagFilter)) return false;
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        (l.company ?? "").toLowerCase().includes(q) ||
        (l.role ?? "").toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
    const sorted = [...base];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "value":
          return (b.value_cents ?? 0) - (a.value_cents ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "stage":
          return STAGE_RANK[a.stage] - STAGE_RANK[b.stage];
        case "recent":
        default: {
          const at = a.last_touched_at ? new Date(a.last_touched_at).getTime() : 0;
          const bt = b.last_touched_at ? new Date(b.last_touched_at).getTime() : 0;
          return bt - at;
        }
      }
    });
    return sorted;
  }, [allLeads, query, stageFilter, tagFilter, sortKey]);

  function toggleStage(s: LeadStage) {
    setStageFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const timelineActs = useMemo<LeadActivity[]>(() => {
    return filtered
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
  }, [filtered]);

  const fullHeight = view === "pipeline";

  return (
    <AppShell crumbs={["Atlas", "Leads"]} fullHeight={fullHeight}>
      <div className={cn("flex min-h-0 flex-1 flex-col", !fullHeight && "h-full")}>
        {/* Hero: lowercase eyebrow + H1 left; Export/New lead right, aligned
         * to the stat-row baseline so the CTA cluster hangs next to the
         * numbers, matching the design. */}
        <div className="border-b border-border-subtle px-10 pb-6 pt-8">
          <div className="mb-1.5 text-[11.5px] font-medium lowercase text-fg-3">
            relationships · pipeline
          </div>
          <h1 className="m-0 font-display text-[38px] font-semibold leading-[1.05] tracking-[-0.022em] text-fg-1">
            Leads
          </h1>

          <div className="mt-6 flex items-end justify-between gap-6">
            <div className="flex-1">
              <LeadStats leads={allLeads} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                leadingIcon={<Icon icon={Upload} size={13} />}
                onClick={() => setImportOpen(true)}
              >
                Import
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
        </div>

        {/* Toolbar: tabs (left) · search pill (centre) · Stage / Sort (right) */}
        <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-app px-10 py-3">
          <div className="inline-flex items-center gap-0.5 rounded-[10px] border border-border-subtle bg-surface-2 p-0.5">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={cn(
                  "rounded-[8px] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors duration-150",
                  view === v.id
                    ? "bg-surface-raised text-fg-1 shadow-1"
                    : "text-fg-2 hover:text-fg-1",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="mx-auto flex h-9 min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-[8px] border border-border-subtle bg-surface-2 px-2.5">
            <Icon icon={Search} size={13} className="text-fg-3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter leads…"
              className="flex-1 bg-transparent text-[12.5px] text-fg-1 outline-none placeholder:text-fg-4"
            />
          </div>

          <div className="relative" ref={stageBtnRef}>
            <button
              type="button"
              onClick={() => setStageMenu((v) => !v)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border-subtle px-3 text-[12.5px] font-medium text-fg-2 transition-colors",
                stageFilter.size
                  ? "bg-accent-tint text-accent"
                  : "bg-surface-raised hover:bg-surface-2",
              )}
            >
              <Icon icon={SlidersHorizontal} size={13} />
              Stage
              {stageFilter.size > 0 && (
                <span className="rounded-full bg-accent px-1.5 py-px text-[10px] font-semibold text-fg-on-accent">
                  {stageFilter.size}
                </span>
              )}
            </button>
            {stageMenu && (
              <div className="absolute end-0 top-full z-30 mt-1 w-[200px] rounded-xl border border-border-subtle bg-surface-raised p-1.5 shadow-3">
                {(Object.keys(STAGE_LABEL) as LeadStage[]).map((s) => {
                  const active = stageFilter.has(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleStage(s)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[12.5px] transition-colors",
                        active ? "bg-accent-tint text-fg-1" : "text-fg-2 hover:bg-surface-hover",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 flex-none items-center justify-center rounded-sm border",
                          active ? "border-accent bg-accent text-fg-on-accent" : "border-border-strong",
                        )}
                      >
                        {active && <Icon icon={Check} size={10} />}
                      </span>
                      {STAGE_LABEL[s]}
                    </button>
                  );
                })}
                {stageFilter.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setStageFilter(new Set())}
                    className="mt-1 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-start text-[12px] font-medium text-fg-3 transition-colors hover:bg-surface-hover hover:text-fg-1"
                  >
                    <Icon icon={XIcon} size={11} /> Clear
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={sortBtnRef}>
            <button
              type="button"
              onClick={() => setSortMenu((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border-subtle bg-surface-raised px-3 text-[12.5px] font-medium text-fg-2 transition-colors hover:bg-surface-2"
            >
              <Icon icon={SortAsc} size={13} /> Sort
              <span className="text-fg-3">· {SORT_LABEL[sortKey].split(" ")[0]}</span>
            </button>
            {sortMenu && (
              <div className="absolute end-0 top-full z-30 mt-1 w-[220px] rounded-xl border border-border-subtle bg-surface-raised p-1.5 shadow-3">
                {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setSortKey(k);
                      setSortMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-start text-[12.5px] transition-colors",
                      sortKey === k ? "bg-accent-tint text-fg-1" : "text-fg-2 hover:bg-surface-hover",
                    )}
                  >
                    {SORT_LABEL[k]}
                    {sortKey === k && <Icon icon={Check} size={11} className="text-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border-subtle bg-surface-app px-10 py-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
              Tags
            </span>
            <button
              type="button"
              onClick={() => setTagFilter(null)}
              className={cn(
                "inline-flex flex-none items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors",
                tagFilter === null
                  ? "border-accent bg-accent-tint text-accent"
                  : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2",
              )}
            >
              All
            </button>
            {availableTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTagFilter(tagFilter === t ? null : t)}
                className={cn(
                  "inline-flex flex-none items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors",
                  tagFilter === t
                    ? "border-accent bg-accent-tint text-accent"
                    : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {leads.isLoading ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Icon icon={UsersIcon} size={28} />}
            title={query ? "No matches." : "No leads yet."}
            hint={query ? "Try a different search." : "Press ⌘⇧L to add one."}
          />
        ) : view === "table" ? (
          <LeadsTable leads={filtered} onSelect={(l: Lead) => openDrawer(l.id)} />
        ) : view === "pipeline" ? (
          <LeadsPipeline
            leads={filtered}
            workspaceId={workspaceId!}
            onSelect={(l) => openDrawer(l.id)}
          />
        ) : (
          <LeadsTimeline
            leads={filtered}
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
