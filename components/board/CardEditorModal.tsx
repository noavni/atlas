"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { SPRING } from "@/lib/motion";
import { useCards, useColumns, useBoards } from "@/lib/queries/boards";
import { useDeleteCard, useMoveCard, useUpdateCard } from "@/lib/queries/cards";
import { useCardEditor } from "@/lib/store/cardEditor";
import { cn } from "@/lib/utils";
import type { Card, WorkflowState } from "@/lib/types";

const STATES: { id: WorkflowState; label: string; tone: string }[] = [
  { id: "backlog", label: "Backlog", tone: "bg-surface-2 text-fg-3" },
  { id: "todo", label: "To do", tone: "bg-accent-tint text-accent" },
  { id: "in_progress", label: "In progress", tone: "bg-[var(--amber-100)] text-[var(--amber-500)]" },
  { id: "in_review", label: "In review", tone: "bg-[var(--apricot-300)] text-[var(--apricot-600)]" },
  { id: "done", label: "Done", tone: "bg-[var(--sage-100)] text-[var(--sage-500)]" },
  { id: "canceled", label: "Canceled", tone: "bg-[var(--persimmon-100)] text-[var(--persimmon-500)]" },
];

interface Props {
  projectId?: string;
}

export function CardEditorModal({ projectId }: Props) {
  const cardId = useCardEditor((s) => s.cardId);
  const close = useCardEditor((s) => s.close);

  const boards = useBoards(projectId);
  const firstBoardId = boards.data?.[0]?.id;
  const columns = useColumns(firstBoardId);
  const cards = useCards(firstBoardId);

  const update = useUpdateCard();
  const move = useMoveCard();
  const del = useDeleteCard();

  const card: Card | null = useMemo(
    () => (cards.data ?? []).find((c) => c.id === cardId) ?? null,
    [cards.data, cardId],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [state, setState] = useState<WorkflowState>("todo");
  const [columnId, setColumnId] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description ?? "");
      setState(card.workflow_state);
      setColumnId(card.column_id);
    }
  }, [card]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && cardId) close();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && cardId) save();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, title, description, state, columnId]);

  async function save() {
    if (!card || !firstBoardId) return;
    const updated = await update.mutateAsync({
      boardId: firstBoardId,
      cardId: card.id,
      version: card.version,
      title: title.trim() || "Untitled",
      description: description.trim() || undefined,
      workflow_state: state,
    });
    if (columnId && columnId !== card.column_id) {
      const destCards = (cards.data ?? []).filter(
        (c) => c.column_id === columnId && c.id !== card.id,
      );
      const tail = destCards.at(-1);
      await move.mutateAsync({
        boardId: firstBoardId,
        cardId: card.id,
        columnId,
        before: tail?.rank ?? null,
        after: null,
        version: updated.version,
      });
    }
    close();
  }

  async function onDelete() {
    if (!card || !firstBoardId) return;
    if (!window.confirm("Delete this card?")) return;
    await del.mutateAsync({ boardId: firstBoardId, cardId: card.id });
    close();
  }

  return (
    <AnimatePresence>
      {cardId && card && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto px-4 py-[8vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={close}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            role="dialog"
            aria-labelledby="card-editor-title"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={SPRING.panel}
            className="relative z-10 flex w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-app shadow-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-none items-center gap-2 border-b border-border-subtle px-5 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                Card
              </span>
              <IconButton
                className="ms-auto"
                size="sm"
                title="Delete"
                onClick={onDelete}
              >
                <Icon icon={Trash2} size={13} />
              </IconButton>
              <IconButton size="sm" title="Close" onClick={close}>
                <Icon icon={X} size={14} />
              </IconButton>
            </div>

            <div className="space-y-4 px-5 py-5">
              <input
                id="card-editor-title"
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                dir="auto"
                placeholder="Card title"
                className="w-full bg-transparent font-display text-[24px] font-semibold tracking-[-0.015em] text-fg-1 outline-none placeholder:text-fg-4"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  Column
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(columns.data ?? []).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColumnId(c.id)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
                        columnId === c.id
                          ? "border-transparent bg-accent text-fg-on-accent"
                          : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2",
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  State
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {STATES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setState(s.id)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
                        state === s.id
                          ? "border-accent bg-accent-tint text-accent"
                          : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  dir="auto"
                  rows={6}
                  placeholder="Notes, context, acceptance criteria…"
                  className="min-h-[140px] w-full rounded-md border border-border-input bg-surface-raised px-3 py-2 font-serif text-[14px] leading-[1.55] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-tint)]"
                />
              </div>
            </div>

            <div className="flex flex-none items-center gap-2 border-t border-border-subtle bg-surface-1/60 px-5 py-3">
              <div className="text-[11px] text-fg-3">⌘ + ⏎ to save · Esc to close</div>
              <div className="ms-auto flex gap-2">
                <Button variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={save} disabled={update.isPending}>
                  {update.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
