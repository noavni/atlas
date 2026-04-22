"use client";

import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { Modal } from "@/components/primitives/Modal";
import { useCreateProject } from "@/lib/queries/projects";
import { useMe } from "@/lib/queries/me";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

const DOT_COLORS = [
  { id: "indigo", value: "var(--indigo-500)", label: "Indigo" },
  { id: "apricot", value: "var(--apricot-500)", label: "Apricot" },
  { id: "sage", value: "var(--sage-500)", label: "Sage" },
  { id: "amber", value: "var(--amber-500)", label: "Amber" },
  { id: "persimmon", value: "var(--persimmon-500)", label: "Persimmon" },
];

export function NewProjectModal() {
  const open = useUI((s) => s.newProjectOpen);
  const setOpen = useUI((s) => s.setNewProjectOpen);
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const create = useCreateProject();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DOT_COLORS[0]!.id);

  useEffect(() => {
    if (!open) {
      setName("");
      setDescription("");
      setColor(DOT_COLORS[0]!.id);
    }
  }, [open]);

  async function submit() {
    const trimmed = name.trim();
    if (!workspaceId || !trimmed) return;
    const id = uuid();
    setOpen(false);
    router.push(`/board/${id}`);
    create.mutate({
      workspaceId,
      id,
      name: trimmed,
      description: description.trim() || undefined,
      color,
    });
  }

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="New project"
      subtitle="Creates a board with Backlog → Done columns."
      icon={<Icon icon={FolderPlus} size={16} />}
      width="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            className="ms-auto"
            variant="primary"
            onClick={submit}
            disabled={!name.trim()}
          >
            Create project
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) submit();
            }}
            placeholder="Kitchen remodel"
            dir="auto"
            className="h-11 rounded-[10px] border border-border-subtle bg-surface-1 px-3.5 text-[15px] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:bg-surface-raised focus:shadow-[0_0_0_3px_var(--accent-tint)]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            Accent
          </label>
          <div className="flex items-center gap-2">
            {DOT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                title={c.label}
                className={cn(
                  "h-8 w-8 rounded-full transition-all duration-150",
                  color === c.id
                    ? "scale-110 ring-2 ring-accent ring-offset-2 ring-offset-surface-raised"
                    : "hover:scale-105",
                )}
                style={{ background: c.value }}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            Description
            <span className="ms-1 font-normal normal-case text-fg-4">optional</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            dir="auto"
            placeholder="What's this project for?"
            className="resize-y rounded-[10px] border border-border-subtle bg-surface-1 px-3.5 py-2.5 font-serif text-[15px] leading-[1.5] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:bg-surface-raised focus:shadow-[0_0_0_3px_var(--accent-tint)]"
          />
        </div>
      </div>
    </Modal>
  );
}
