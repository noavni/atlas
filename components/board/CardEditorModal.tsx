"use client";

import { LayoutGrid, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { Modal } from "@/components/primitives/Modal";
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

  if (!card) return null;

  return (
    <Modal
      open={!!cardId}
      onClose={close}
      title=""
      headerOverride={
        <div className="flex flex-none items-center gap-2 px-6 pb-4 pt-5">
          <span className="flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-accent-tint text-accent">
            <Icon icon={LayoutGrid} size={13} />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-3">
            Card
          </span>
          <IconButton
            className="ms-auto"
            size="sm"
            title="Delete card"
            onClick={onDelete}
          >
            <Icon icon={Trash2} size={13} />
          </IconButton>
        </div>
      }
      width="md"
      footer={
        <>
          <div className="text-[11px] text-fg-3">⌘ + ⏎ to save · Esc to close</div>
          <div className="ms-auto flex gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} disabled={update.isPending}>
              {update.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          dir="auto"
          placeholder="Untitled"
          className="w-full bg-transparent font-display text-[26px] font-semibold leading-[1.1] tracking-[-0.015em] text-fg-1 outline-none placeholder:text-fg-4"
        />

        <Section label="Column">
          <Pills>
            {(columns.data ?? []).map((c) => (
              <Pill
                key={c.id}
                active={columnId === c.id}
                onClick={() => setColumnId(c.id)}
              >
                {c.name}
              </Pill>
            ))}
          </Pills>
        </Section>

        <Section label="Status">
          <Pills>
            {STATES.map((s) => (
              <Pill key={s.id} active={state === s.id} onClick={() => setState(s.id)}>
                {s.label}
              </Pill>
            ))}
          </Pills>
        </Section>

        <Section label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            dir="auto"
            rows={6}
            placeholder="Notes, context, acceptance criteria…"
            className="min-h-[140px] w-full resize-y rounded-[12px] border border-border-subtle bg-surface-1 px-3.5 py-3 font-serif text-[15px] leading-[1.55] text-fg-1 outline-none placeholder:text-fg-4 focus:border-accent focus:bg-surface-raised focus:shadow-[0_0_0_3px_var(--accent-tint)]"
          />
        </Section>
      </div>
    </Modal>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-fg-3">
        {label}
      </div>
      {children}
    </div>
  );
}

function Pills({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[12px] font-medium transition-all duration-150",
        active
          ? "border-transparent bg-accent text-fg-on-accent shadow-1"
          : "border-border-subtle bg-surface-1 text-fg-2 hover:border-border-strong hover:bg-surface-2 hover:text-fg-1",
      )}
    >
      {children}
    </button>
  );
}
