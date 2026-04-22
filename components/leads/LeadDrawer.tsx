"use client";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  ArrowRightCircle,
  Calendar,
  ExternalLink,
  FileText,
  Linkedin,
  Mail,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { LeadAvatar } from "./LeadAvatar";
import { StagePill } from "./StagePill";
import { relativeTime } from "@/lib/leads";
import { useLeadDetail } from "@/lib/queries/leads";
import { useLeadsUI } from "@/lib/store/leads";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";
import type { LeadActivity, LeadActivityKind } from "@/lib/types";

const ACT_ICON: Record<LeadActivityKind, typeof Mail> = {
  email: Mail,
  call: Phone,
  note: FileText,
  stage: ArrowRightCircle,
  file: FileText,
  meeting: ArrowRightCircle,
};

export function LeadDrawer() {
  const leadId = useLeadsUI((s) => s.drawerLeadId);
  const close = useLeadsUI((s) => s.closeLeadDrawer);
  const dir = useUI((s) => s.dir);
  const reducedMotion = useReducedMotion();
  const detail = useLeadDetail(leadId ?? undefined);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && leadId) close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [leadId, close]);

  const slideFrom = reducedMotion ? 0 : dir === "rtl" ? "-100%" : "100%";

  return (
    <AnimatePresence>
      {leadId && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden="true"
          />
          <motion.aside
            key="lead-drawer"
            role="dialog"
            aria-labelledby="lead-drawer-title"
            className={cn(
              "fixed top-0 z-50 flex h-full w-[540px] max-w-[92vw] flex-col overflow-hidden bg-surface-app shadow-4",
              dir === "rtl"
                ? "left-0 border-e border-border-subtle"
                : "right-0 border-s border-border-subtle",
            )}
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          >
            {detail.data ? (
              <>
                <div className="flex items-center gap-3 border-b border-border-subtle px-6 py-4">
                  <LeadAvatar lead={detail.data.lead} size={32} />
                  <div className="min-w-0 flex-1">
                    <div
                      id="lead-drawer-title"
                      className="truncate text-[14px] font-semibold text-fg-1"
                    >
                      {detail.data.lead.name}
                    </div>
                    <div className="truncate text-[11.5px] text-fg-3">
                      {[detail.data.lead.role, detail.data.lead.company]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <Link
                    href={`/leads/${detail.data.lead.id}`}
                    onClick={() => close()}
                    className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-raised px-2.5 py-1 text-[11.5px] font-medium text-fg-2 shadow-1 transition-colors hover:bg-surface-2"
                  >
                    Open
                    <Icon icon={ExternalLink} size={11} />
                  </Link>
                  <IconButton size="sm" title="Close" onClick={close}>
                    <Icon icon={X} size={14} />
                  </IconButton>
                </div>

                <div className="atlas-board-scroll flex-1 overflow-y-auto px-6 py-5">
                  <div className="mb-5 flex items-start gap-4">
                    <LeadAvatar lead={detail.data.lead} size={56} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-[24px] font-semibold leading-[1.1] tracking-[-0.018em] text-fg-1">
                        {detail.data.lead.name}
                      </h2>
                      <div className="mt-1 text-[12.5px] text-fg-3">
                        {[detail.data.lead.role, detail.data.lead.company]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <StagePill stage={detail.data.lead.stage} />
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 grid grid-cols-3 gap-2">
                    <Button
                      variant="primary"
                      className="w-full justify-center"
                      leadingIcon={<Icon icon={Sparkles} size={13} />}
                    >
                      Draft
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full justify-center"
                      leadingIcon={<Icon icon={Mail} size={13} />}
                      disabled={!detail.data.lead.email}
                      onClick={() =>
                        detail.data?.lead.email &&
                        window.open(`mailto:${detail.data.lead.email}`, "_self")
                      }
                    >
                      Email
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full justify-center"
                      leadingIcon={<Icon icon={Calendar} size={13} />}
                    >
                      Schedule
                    </Button>
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-3.5 rounded-xl border border-border-subtle bg-surface-1 p-4">
                    {[
                      ["Source", detail.data.lead.source || "—"],
                      ["Location", detail.data.lead.location || "—"],
                      ["Last touch", relativeTime(detail.data.lead.last_touched_at)],
                      ["Next step", detail.data.lead.next_step || "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-1">
                        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                          {k}
                        </div>
                        <div className="truncate text-[13px] font-medium text-fg-1">{v}</div>
                      </div>
                    ))}
                  </div>

                  {(detail.data.lead.email ||
                    detail.data.lead.phone ||
                    detail.data.lead.linkedin_url) && (
                    <div className="mb-6 flex flex-col gap-1.5">
                      {detail.data.lead.email && (
                        <ContactRow icon={Mail} href={`mailto:${detail.data.lead.email}`}>
                          {detail.data.lead.email}
                        </ContactRow>
                      )}
                      {detail.data.lead.phone && (
                        <ContactRow icon={Phone} href={`tel:${detail.data.lead.phone}`}>
                          {detail.data.lead.phone}
                        </ContactRow>
                      )}
                      {detail.data.lead.linkedin_url && (
                        <ContactRow icon={Linkedin} href={detail.data.lead.linkedin_url}>
                          LinkedIn profile
                        </ContactRow>
                      )}
                    </div>
                  )}

                  <section className="mb-6">
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                      Activity · {detail.data.activities.length}
                    </h3>
                    <ul className="relative flex flex-col gap-3 ps-4">
                      <span
                        className="absolute start-[13px] top-0 h-full w-px bg-border-subtle"
                        aria-hidden="true"
                      />
                      {detail.data.activities.slice(0, 10).map((a) => (
                        <ActRow key={a.id} a={a} />
                      ))}
                    </ul>
                  </section>

                  {detail.data.lead.tags.length > 0 && (
                    <section>
                      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {detail.data.lead.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-xs bg-surface-2 px-1.5 py-px text-[10.5px] font-medium text-fg-3"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </>
            ) : (
              <div className="animate-pulse p-6">
                <div className="h-20 rounded-md bg-surface-2" />
                <div className="mt-4 h-32 rounded-md bg-surface-2" />
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function ActRow({ a }: { a: LeadActivity }) {
  const Ic = ACT_ICON[a.kind];
  return (
    <li className="relative flex items-start gap-3">
      <span className="z-10 flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border border-border-subtle bg-surface-raised text-fg-2">
        <Icon icon={Ic} size={12} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium text-fg-1">{a.headline}</div>
        <div className="text-[11px] text-fg-3">{relativeTime(a.created_at)}</div>
        {a.detail && (
          <div className="mt-1 font-serif text-[13.5px] leading-[1.5] text-fg-2">{a.detail}</div>
        )}
      </div>
    </li>
  );
}

function ContactRow({
  icon,
  children,
  href,
}: {
  icon: typeof Mail;
  children: React.ReactNode;
  href?: string;
}) {
  const inner = (
    <span className="flex items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-[12.5px] text-fg-1 transition-colors">
      <Icon icon={icon} size={13} className="text-fg-3" />
      <span className="truncate">{children}</span>
    </span>
  );
  return href ? (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="block transition-colors [&>span:hover]:bg-surface-2"
    >
      {inner}
    </a>
  ) : (
    inner
  );
}
