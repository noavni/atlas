import type { LeadStage } from "@/lib/types";

export const STAGE_LABEL: Record<LeadStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

/** Visual classes per stage — matches the handoff's `.stage-pill` variants. */
export const STAGE_PILL: Record<
  LeadStage,
  { bg: string; fg: string; dot: string }
> = {
  new: {
    bg: "bg-accent-tint",
    fg: "text-accent",
    dot: "bg-accent",
  },
  contacted: {
    bg: "bg-[var(--apricot-300)]",
    fg: "text-[var(--apricot-600)]",
    dot: "bg-[var(--apricot-500)]",
  },
  qualified: {
    bg: "bg-[var(--amber-100)]",
    fg: "text-[var(--amber-500)]",
    dot: "bg-[var(--amber-500)]",
  },
  proposal: {
    bg: "bg-[color-mix(in_oklch,var(--accent-primary)_14%,var(--surface-raised))]",
    fg: "text-accent",
    dot: "bg-accent",
  },
  won: {
    bg: "bg-[var(--sage-100)]",
    fg: "text-[var(--sage-500)]",
    dot: "bg-[var(--sage-500)]",
  },
  lost: {
    bg: "bg-[var(--persimmon-100)]",
    fg: "text-[var(--persimmon-500)]",
    dot: "bg-[var(--persimmon-500)]",
  },
};

export const PIPELINE_ORDER: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

export const STAGE_BAR_ORDER: LeadStage[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
];

export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) {
    return `$${(dollars / 1_000_000).toFixed(1)}m`;
  }
  if (dollars >= 1000) {
    return `$${Math.round(dollars / 1000)}k`;
  }
  return `$${dollars.toFixed(0)}`;
}

export function formatFullMoney(cents: number): string {
  const n = Math.round(cents / 100);
  return `$${n.toLocaleString()}`;
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 2) return "Yesterday";
  if (diff < 86400 * 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function avatarInitials(lead: { avatar_initials: string | null; name: string }): string {
  if (lead.avatar_initials) return lead.avatar_initials;
  const parts = lead.name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts.at(-1)![0]!).toUpperCase();
}
