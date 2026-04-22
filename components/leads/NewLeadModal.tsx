"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { Modal } from "@/components/primitives/Modal";
import { STAGE_LABEL, PIPELINE_ORDER } from "@/lib/leads";
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
  const [stage, setStage] = useState<LeadStage>("new");
  const [firstNote, setFirstNote] = useState("");

  useEffect(() => {
    if (!open) {
      setName("");
      setRoleCompany("");
      setEmail("");
      setPhone("");
      setSource("Referral");
      setStage("new");
      setFirstNote("");
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        setOpen(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function submit() {
    if (!workspaceId || !name.trim()) return;
    const [roleStr = "", companyStr = ""] = roleCompany.split(/\s*·\s*|,\s*/);
    await create.mutateAsync({
      workspaceId,
      name: name.trim(),
      role: roleStr.trim() || undefined,
      company: companyStr.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      source: source || undefined,
      stage,
      avatar_color: randColor(name),
      first_note: firstNote.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="New lead"
      subtitle="Add someone to the pipeline — start with a name, fill in the rest later."
      icon={<Icon icon={Sparkles} size={16} />}
      width="md"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <div className="ms-auto flex gap-2">
            <Button
              variant="secondary"
              onClick={submit}
              disabled={!name.trim() || create.isPending}
            >
              Save &amp; add another
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              disabled={!name.trim() || create.isPending}
            >
              Save lead
            </Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Name">
          <Input autoFocus value={name} onChange={setName} placeholder="Maya Greenberg" />
        </Field>

        <Field label="Role · Company">
          <Input
            value={roleCompany}
            onChange={setRoleCompany}
            placeholder="Co-founder · Ferngrove Studio"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Email">
            <Input value={email} onChange={setEmail} type="email" placeholder="maya@…" />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={setPhone} placeholder="+972 50 …" />
          </Field>
        </div>

        <Field label="Source">
          <Select value={source} onChange={setSource}>
            <option>Referral</option>
            <option>Cold email</option>
            <option>LinkedIn inbound</option>
            <option>Instagram inbound</option>
            <option>Event</option>
            <option>Webinar signup</option>
            <option>Press mention</option>
          </Select>
        </Field>

        <Field label="Stage">
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_ORDER.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(s)}
                className={cn(
                  "rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150",
                  stage === s
                    ? "border-transparent bg-accent text-fg-on-accent shadow-1"
                    : "border-border-subtle bg-surface-1 text-fg-2 hover:border-border-strong hover:bg-surface-2 hover:text-fg-1",
                )}
              >
                {STAGE_LABEL[s]}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="First note"
          hint="What should we remember about them?"
        >
          <textarea
            value={firstNote}
            onChange={(e) => setFirstNote(e.target.value)}
            rows={3}
            dir="auto"
            className="min-h-[96px] w-full resize-y rounded-[10px] border border-border-subtle bg-surface-1 px-3.5 py-2.5 font-serif text-[15px] leading-[1.5] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:bg-surface-raised focus:shadow-[0_0_0_3px_var(--accent-tint)]"
          />
        </Field>
      </div>
    </Modal>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
        {label}
        {hint && (
          <span className="font-normal normal-case tracking-normal text-fg-4">· {hint}</span>
        )}
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
      dir="auto"
      className="h-11 rounded-[10px] border border-border-subtle bg-surface-1 px-3.5 text-[15px] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:bg-surface-raised focus:shadow-[0_0_0_3px_var(--accent-tint)]"
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
      className="h-11 rounded-[10px] border border-border-subtle bg-surface-1 px-3 text-[15px] text-fg-1 outline-none focus:border-accent focus:bg-surface-raised focus:shadow-[0_0_0_3px_var(--accent-tint)]"
    >
      {children}
    </select>
  );
}
