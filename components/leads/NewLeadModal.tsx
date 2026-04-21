"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { STAGE_LABEL, PIPELINE_ORDER } from "@/lib/leads";
import { SPRING } from "@/lib/motion";
import { useMe } from "@/lib/queries/me";
import { useCreateLead } from "@/lib/queries/leads";
import { useLeadsUI } from "@/lib/store/leads";
import { cn } from "@/lib/utils";
import type { LeadStage } from "@/lib/types";

const COLORS = [
  "#FF8A3D",
  "#3D49F5",
  "#4F9868",
  "#DB951C",
  "#DE4F2D",
  "#E86D1F",
  "#222AA3",
  "#5F69FF",
];

function randColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length]!;
}

export function NewLeadModal() {
  const open = useLeadsUI((s) => s.newLeadOpen);
  const setOpen = useLeadsUI((s) => s.setNewLeadOpen);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const create = useCreateLead();

  const [name, setName] = useState("");
  const [roleCompany, setRoleCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("Referral");
  const [valueStr, setValueStr] = useState("");
  const [stage, setStage] = useState<LeadStage>("new");
  const [firstNote, setFirstNote] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setRoleCompany("");
      setEmail("");
      setPhone("");
      setSource("Referral");
      setValueStr("");
      setStage("new");
      setFirstNote("");
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function submit() {
    if (!workspaceId || !name.trim()) return;
    const [roleStr = "", companyStr = ""] = roleCompany.split(/\s*·\s*|,\s*/);
    const cents = Math.round(parseFloat(valueStr.replace(/[^0-9.]/g, "")) * 100 || 0);
    await create.mutateAsync({
      workspaceId,
      name: name.trim(),
      role: roleStr.trim() || undefined,
      company: companyStr.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source || undefined,
      value_cents: cents || 0,
      stage,
      avatar_color: randColor(name),
      first_note: firstNote.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto px-4 py-[4vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            role="dialog"
            aria-labelledby="new-lead-title"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={SPRING.panel}
            className="relative z-10 flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-app shadow-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-none items-center gap-2.5 border-b border-border-subtle px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-fg-on-accent">
                <Icon icon={Sparkles} size={14} />
              </span>
              <h2
                id="new-lead-title"
                className="font-display text-[20px] font-semibold tracking-[-0.015em] text-fg-1"
              >
                New lead
              </h2>
              <IconButton className="ms-auto" size="sm" title="Close" onClick={() => setOpen(false)}>
                <Icon icon={X} size={14} />
              </IconButton>
            </div>

            <div className="atlas-board-scroll flex-1 space-y-3.5 overflow-y-auto px-5 py-4">
              <div className="rounded-xl border border-dashed border-[color-mix(in_oklch,var(--accent-primary)_40%,transparent)] bg-[color-mix(in_oklch,var(--accent-primary)_6%,var(--surface-raised))] p-3.5">
                <div className="mb-1.5 flex items-center gap-2 text-[12.5px] font-semibold text-accent">
                  <Icon icon={Sparkles} size={13} />
                  Paste anything
                </div>
                <p className="mb-2 text-[12px] text-fg-3">
                  Signature, business card OCR, LinkedIn URL — we'll fill the fields.
                </p>
                <textarea
                  placeholder="Paste here (coming soon)"
                  className="h-14 w-full resize-none rounded-md border border-border-subtle bg-surface-raised px-2.5 py-2 font-mono text-[11.5px] text-fg-2 outline-none placeholder:text-fg-4 focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                <Field label="Name" full>
                  <Input value={name} onChange={setName} autoFocus placeholder="Maya Greenberg" />
                </Field>
                <Field label="Role · Company" full>
                  <Input
                    value={roleCompany}
                    onChange={setRoleCompany}
                    placeholder="Co-founder · Ferngrove Studio"
                  />
                </Field>
                <Field label="Email">
                  <Input value={email} onChange={setEmail} type="email" placeholder="maya@…" />
                </Field>
                <Field label="Phone">
                  <Input value={phone} onChange={setPhone} placeholder="+1 …" />
                </Field>
                <Field label="Source">
                  <Select value={source} onChange={setSource}>
                    <option>Referral</option>
                    <option>Cold email</option>
                    <option>LinkedIn inbound</option>
                    <option>Event</option>
                    <option>Webinar signup</option>
                    <option>Press mention</option>
                  </Select>
                </Field>
                <Field label="Value ($)">
                  <Input value={valueStr} onChange={setValueStr} placeholder="24,000" />
                </Field>
                <Field label="Stage" full>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE_ORDER.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStage(s)}
                        className={cn(
                          "rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
                          stage === s
                            ? "border-transparent bg-accent text-fg-on-accent"
                            : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2",
                        )}
                      >
                        {STAGE_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="First note" full>
                  <textarea
                    value={firstNote}
                    onChange={(e) => setFirstNote(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded-md border border-border-input bg-surface-raised px-2.5 py-2 font-serif text-[14px] leading-[1.5] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)]"
                    placeholder="What should we remember about them?"
                  />
                </Field>
              </div>
            </div>

            <div className="flex flex-none items-center gap-2 border-t border-border-subtle bg-surface-1/60 px-5 py-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <div className="ms-auto flex gap-2">
                <Button variant="secondary" onClick={submit} disabled={!name.trim() || create.isPending}>
                  Save &amp; add another
                </Button>
                <Button variant="primary" onClick={submit} disabled={!name.trim() || create.isPending}>
                  Save lead
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  full = false,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", full && "col-span-2")}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-border-input bg-surface-raised px-2.5 text-[13px] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)]"
    />
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-border-input bg-surface-raised px-2.5 text-[13px] text-fg-1 outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)]"
    >
      {children}
    </select>
  );
}
