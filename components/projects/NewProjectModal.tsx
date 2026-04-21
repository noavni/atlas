"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { SPRING } from "@/lib/motion";
import { useCreateProject } from "@/lib/queries/projects";
import { useMe } from "@/lib/queries/me";
import { useUI } from "@/lib/store/ui";
import { cn } from "@/lib/utils";

const DOT_COLORS = [
  { id: "indigo", value: "var(--indigo-500)" },
  { id: "apricot", value: "var(--apricot-500)" },
  { id: "sage", value: "var(--sage-500)" },
  { id: "amber", value: "var(--amber-500)" },
  { id: "persimmon", value: "var(--persimmon-500)" },
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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  async function submit() {
    const trimmed = name.trim();
    if (!workspaceId || !trimmed) return;
    const id = uuid();
    // Close and navigate instantly — the optimistic cache insertion inside
    // useCreateProject makes the new project visible in the sidebar and
    // routable immediately. The network call completes in the background.
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
            aria-labelledby="new-project-title"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={SPRING.panel}
            className="relative z-10 flex w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-app shadow-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-none items-center gap-2.5 border-b border-border-subtle px-5 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-accent text-fg-on-accent">
                <Icon icon={FolderPlus} size={14} />
              </span>
              <h2
                id="new-project-title"
                className="font-display text-[20px] font-semibold tracking-[-0.015em] text-fg-1"
              >
                New project
              </h2>
              <IconButton
                className="ms-auto"
                size="sm"
                title="Close"
                onClick={() => setOpen(false)}
              >
                <Icon icon={X} size={14} />
              </IconButton>
            </div>

            <div className="space-y-3.5 px-5 py-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  Name
                </label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) submit();
                  }}
                  placeholder="e.g. Kitchen remodel"
                  className="h-10 rounded-md border border-border-input bg-surface-raised px-3 text-[14px] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  {DOT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.id)}
                      title={c.id}
                      className={cn(
                        "h-8 w-8 rounded-full transition-transform duration-150 hover:scale-110",
                        color === c.id &&
                          "ring-2 ring-accent ring-offset-2 ring-offset-surface-app",
                      )}
                      style={{ background: c.value }}
                      aria-label={c.id}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  Description
                  <span className="ms-1 font-normal text-fg-4">optional</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What's this project for?"
                  className="rounded-md border border-border-input bg-surface-raised px-3 py-2 font-serif text-[14px] leading-[1.45] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)]"
                />
              </div>
            </div>

            <div className="flex flex-none items-center gap-2 border-t border-border-subtle bg-surface-1/60 px-5 py-3">
              <div className="text-[11.5px] text-fg-3">
                Auto-creates 5 columns · Backlog → Done
              </div>
              <div className="ms-auto flex items-center gap-2">
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={submit} disabled={!name.trim()}>
                  Create project
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
