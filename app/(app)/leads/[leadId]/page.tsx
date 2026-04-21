"use client";

import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Linkedin,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { LeadAvatar } from "@/components/leads/LeadAvatar";
import { StageBar } from "@/components/leads/StageBar";
import { formatFullMoney, relativeTime } from "@/lib/leads";
import { SPRING } from "@/lib/motion";
import {
  useAddActivity,
  useLeadDetail,
  useLeads,
  useToggleTask,
  useUpdateLead,
} from "@/lib/queries/leads";
import { useMe } from "@/lib/queries/me";
import type { LeadActivity, LeadActivityKind, LeadStage } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Params {
  params: Promise<{ leadId: string }>;
}

export default function LeadDetailPage({ params }: Params) {
  const { leadId } = use(params);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const detail = useLeadDetail(leadId);
  const all = useLeads(workspaceId);
  const update = useUpdateLead();
  const addActivity = useAddActivity();
  const toggleTask = useToggleTask();
  const router = useRouter();

  const [noteText, setNoteText] = useState("");

  const lead = detail.data?.lead;
  const activities = detail.data?.activities ?? [];
  const tasks = detail.data?.tasks ?? [];

  const [prev, next] = useMemo(() => {
    if (!all.data || !lead) return [null, null] as const;
    const list = all.data;
    const idx = list.findIndex((l) => l.id === lead.id);
    return [list[idx - 1] ?? null, list[idx + 1] ?? null] as const;
  }, [all.data, lead]);

  function postNote() {
    if (!lead || !noteText.trim()) return;
    addActivity.mutate({
      leadId: lead.id,
      kind: "note",
      headline: "Note",
      detail: noteText.trim(),
    });
    setNoteText("");
  }

  return (
    <AppShell crumbs={["Atlas", "Leads", lead?.name ?? "…"]}>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-4 px-10 pt-6">
          <div className="flex items-center gap-2 text-[12.5px] text-fg-2">
            <Link
              href="/leads"
              className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-fg-2 shadow-1 transition-colors hover:bg-surface-2"
            >
              <Icon icon={ArrowLeft} size={12} />
              Leads
            </Link>
            <span className="text-fg-4">/</span>
            <span className="font-medium text-fg-1">{lead?.name ?? ""}</span>
          </div>
          <div className="flex items-center gap-1">
            <IconButton
              size="sm"
              title="Previous"
              onClick={() => prev && router.push(`/leads/${prev.id}`)}
              disabled={!prev}
            >
              <Icon icon={ChevronLeft} size={13} />
            </IconButton>
            <IconButton
              size="sm"
              title="Next"
              onClick={() => next && router.push(`/leads/${next.id}`)}
              disabled={!next}
            >
              <Icon icon={ChevronRight} size={13} />
            </IconButton>
            <IconButton size="sm" title="More">
              <Icon icon={MoreHorizontal} size={13} />
            </IconButton>
          </div>
        </div>

        {!lead ? (
          <DetailSkeleton />
        ) : (
          <>
            <div className="flex items-start justify-between gap-6 border-b border-border-subtle px-10 py-6">
              <div className="flex items-start gap-4">
                <LeadAvatar lead={lead} size={72} />
                <div>
                  <h1 className="font-display text-[28px] font-semibold leading-[1.05] tracking-[-0.018em] text-fg-1">
                    {lead.name}
                  </h1>
                  <div className="mt-0.5 text-[13.5px] text-fg-3">
                    {[lead.role, lead.company].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-fg-2">
                    {lead.email && (
                      <ContactLink icon={Mail} href={`mailto:${lead.email}`}>
                        {lead.email}
                      </ContactLink>
                    )}
                    {lead.phone && (
                      <ContactLink icon={Phone} href={`tel:${lead.phone}`}>
                        {lead.phone}
                      </ContactLink>
                    )}
                    {lead.location && (
                      <ContactLink icon={MapPin}>{lead.location}</ContactLink>
                    )}
                    {lead.linkedin_url && (
                      <ContactLink icon={Linkedin} href={lead.linkedin_url}>
                        LinkedIn
                      </ContactLink>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" leadingIcon={<Icon icon={Mail} size={13} />}>
                  Email
                </Button>
                <Button variant="secondary" leadingIcon={<Icon icon={Calendar} size={13} />}>
                  Schedule
                </Button>
                <Button variant="primary" leadingIcon={<Icon icon={Sparkles} size={13} />}>
                  Draft follow-up
                </Button>
              </div>
            </div>

            <StageBar
              current={lead.stage}
              onPick={(s: LeadStage) =>
                update.mutate({ leadId: lead.id, workspaceId: workspaceId!, patch: { stage: s } })
              }
            />

            <div className="grid gap-6 px-10 pb-20 md:grid-cols-[1.4fr_1fr]">
              <div className="flex flex-col gap-5">
                <Card>
                  <h3 className="mb-2 flex items-center justify-between text-[13px] font-semibold text-fg-1">
                    Add update
                    <button className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-accent hover:text-accent-hover">
                      <Icon icon={Sparkles} size={11} /> AI summarize
                    </button>
                  </h3>
                  <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={3}
                      placeholder="What happened with them today?"
                      className="w-full resize-none bg-transparent font-serif text-[14px] leading-[1.5] text-fg-1 outline-none placeholder:text-fg-4"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <IconButton size="sm" title="Attach">
                        <Icon icon={Plus} size={13} />
                      </IconButton>
                      <div className="ms-auto" />
                      <Button
                        variant="primary"
                        onClick={postNote}
                        disabled={!noteText.trim() || addActivity.isPending}
                      >
                        Post
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card title="Activity" count={activities.length}>
                  <ActivityList items={activities} />
                </Card>
              </div>

              <div className="flex flex-col gap-5">
                <Card title="Details">
                  <div className="grid grid-cols-2 gap-x-5 gap-y-4">
                    {[
                      ["Stage", lead.stage],
                      ["Value", formatFullMoney(lead.value_cents || 0)],
                      ["Source", lead.source || "—"],
                      ["Owner", lead.owner_id ? "You" : "—"],
                      ["Created", relativeTime(lead.created_at)],
                      ["Last touch", relativeTime(lead.last_touched_at)],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-1">
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                          {k}
                        </div>
                        <div className="truncate text-[13px] font-medium text-fg-1">{v}</div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Next steps" count={tasks.length}>
                  <ul className="flex flex-col gap-2.5">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleTask.mutate({ leadId: lead.id, task: t })}
                          className={cn(
                            "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2 border-border-strong transition-colors duration-150",
                            t.done && "border-transparent bg-[var(--sage-500)]",
                          )}
                          aria-pressed={t.done}
                        >
                          {t.done && <Icon icon={Check} size={10} className="text-white" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div
                            className={cn(
                              "text-[13px]",
                              t.done ? "text-fg-3 line-through" : "text-fg-1",
                            )}
                          >
                            {t.title}
                          </div>
                          {t.due_at && (
                            <div className="text-[11.5px] text-fg-3">
                              Due {relativeTime(t.due_at)}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>

                {lead.tags.length > 0 && (
                  <Card title="Tags">
                    <div className="flex flex-wrap gap-1.5">
                      {lead.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-xs bg-surface-2 px-1.5 py-px text-[10.5px] font-medium text-fg-3"
                        >
                          {t}
                        </span>
                      ))}
                      <button className="rounded-xs border border-dashed border-border-strong px-1.5 py-px text-[10.5px] font-medium text-fg-3 hover:text-fg-1">
                        + add
                      </button>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function ContactLink({
  icon,
  children,
  href,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <span className="inline-flex items-center gap-1.5">
      <Icon icon={icon} size={13} />
      {children}
    </span>
  );
  return href ? (
    <a href={href} className="transition-opacity hover:opacity-80">
      {inner}
    </a>
  ) : (
    inner
  );
}

function Card({
  title,
  count,
  children,
}: {
  title?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      layout
      transition={SPRING.gentle}
      className="rounded-xl border border-border-subtle bg-surface-raised p-5 shadow-1"
    >
      {title && (
        <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-fg-1">
          {title}
          {count != null && (
            <span className="rounded-full bg-surface-2 px-1.5 py-px text-[11px] font-medium text-fg-3">
              {count}
            </span>
          )}
        </h3>
      )}
      {children}
    </motion.section>
  );
}

function ActivityList({ items }: { items: LeadActivity[] }) {
  return (
    <ol className="relative flex flex-col gap-3 ps-4">
      <span className="absolute start-[13px] top-0 h-full w-px bg-border-subtle" aria-hidden="true" />
      {items.map((a) => (
        <li key={a.id} className="relative flex items-start gap-3">
          <span className="z-10 flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border border-border-subtle bg-surface-raised text-fg-2">
            <Icon icon={iconFor(a.kind)} size={12} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-medium text-fg-1">{a.headline}</div>
            <div className="text-[11px] text-fg-3">{relativeTime(a.created_at)}</div>
            {a.detail && (
              <div className="mt-1 font-serif text-[13.5px] leading-[1.5] text-fg-2">
                {a.detail}
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

import { Check, FileText, ArrowRightCircle } from "lucide-react";
function iconFor(k: LeadActivityKind) {
  switch (k) {
    case "call":
      return Phone;
    case "email":
      return Mail;
    case "note":
      return FileText;
    case "stage":
      return ArrowRightCircle;
    case "meeting":
      return Calendar;
    default:
      return FileText;
  }
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse px-10 py-8">
      <div className="h-24 rounded-md bg-surface-2" />
      <div className="mt-6 h-20 rounded-md bg-surface-2" />
      <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="h-64 rounded-md bg-surface-2" />
        <div className="h-64 rounded-md bg-surface-2" />
      </div>
    </div>
  );
}
