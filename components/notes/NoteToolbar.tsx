"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Type,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { useActiveEditor } from "@/lib/store/activeEditor";
import { cn } from "@/lib/utils";

/* Saturated, actually-colorful palette. These are real brand colors
 * mapped to our design tokens where possible, pure hex where not.
 * Light mode and dark mode both look good against them. */
const TEXT_COLORS: { key: string; value: string; label: string }[] = [
  { key: "default", value: "", label: "Default" },
  { key: "red", value: "#EF4444", label: "Red" },
  { key: "orange", value: "#F97316", label: "Orange" },
  { key: "amber", value: "#F59E0B", label: "Amber" },
  { key: "green", value: "#10B981", label: "Green" },
  { key: "teal", value: "#14B8A6", label: "Teal" },
  { key: "blue", value: "#3B82F6", label: "Blue" },
  { key: "indigo", value: "#6366F1", label: "Indigo" },
  { key: "violet", value: "#8B5CF6", label: "Violet" },
  { key: "pink", value: "#EC4899", label: "Pink" },
];

const HIGHLIGHT_COLORS: { key: string; value: string; label: string }[] = [
  { key: "none", value: "", label: "None" },
  { key: "yellow", value: "#FDE68A", label: "Yellow" },
  { key: "orange", value: "#FED7AA", label: "Orange" },
  { key: "pink", value: "#FBCFE8", label: "Pink" },
  { key: "green", value: "#A7F3D0", label: "Green" },
  { key: "blue", value: "#BFDBFE", label: "Blue" },
  { key: "violet", value: "#DDD6FE", label: "Violet" },
];

function useEditorTick(editor: Editor | null): void {
  // Subscribe to editor transactions so isActive() returns fresh values.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const handler = () => setTick((t) => t + 1);
    editor.on("transaction", handler);
    editor.on("selectionUpdate", handler);
    return () => {
      editor.off("transaction", handler);
      editor.off("selectionUpdate", handler);
    };
  }, [editor]);
}

export function NoteToolbar() {
  const editor = useActiveEditor((s) => s.editor);
  useEditorTick(editor);

  const promptLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-full items-center justify-center px-4 text-center text-[12px] text-fg-4">
        Open a note to see formatting.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-3.5 py-5 text-fg-2">
      <Section title="History">
        <Row>
          <TBtn
            label="Undo"
            icon={Undo2}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          />
          <TBtn
            label="Redo"
            icon={Redo2}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          />
        </Row>
      </Section>

      <Section title="Text">
        <Row>
          <TBtn
            label="Bold"
            icon={Bold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
          />
          <TBtn
            label="Italic"
            icon={Italic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
          />
          <TBtn
            label="Underline"
            icon={UnderlineIcon}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
          />
          <TBtn
            label="Strike"
            icon={Strikethrough}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
          />
          <TBtn
            label="Code"
            icon={Code2}
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive("code")}
          />
          <TBtn
            label="Link"
            icon={LinkIcon}
            onClick={promptLink}
            active={editor.isActive("link")}
          />
        </Row>
      </Section>

      <Section title="Color">
        <div className="grid grid-cols-5 gap-1.5">
          {TEXT_COLORS.map((c) => {
            const active =
              c.key === "default"
                ? !editor.isActive("textStyle", { color: /.+/ })
                : editor.isActive("textStyle", { color: c.value });
            return (
              <button
                key={c.key}
                type="button"
                title={c.label}
                onClick={() => {
                  if (c.key === "default") editor.chain().focus().unsetColor().run();
                  else editor.chain().focus().setColor(c.value).run();
                }}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-105",
                  active
                    ? "border-accent ring-2 ring-accent ring-offset-1 ring-offset-surface-app"
                    : "border-border-subtle",
                )}
                style={{
                  background:
                    c.key === "default" ? "var(--surface-1)" : c.value,
                }}
              >
                {c.key === "default" && (
                  <Icon icon={Type} size={11} className="text-fg-2" />
                )}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Highlight">
        <div className="grid grid-cols-7 gap-1.5">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              onClick={() => {
                if (c.key === "none") editor.chain().focus().unsetHighlight().run();
                else editor.chain().focus().setHighlight({ color: c.value }).run();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle transition-transform hover:scale-110"
              style={{
                background: c.key === "none" ? "var(--surface-1)" : c.value,
              }}
            >
              {c.key === "none" && (
                <span className="text-[10px] text-fg-3">—</span>
              )}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Heading">
        <Row>
          <TBtn
            label="H1"
            icon={Heading1}
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          />
          <TBtn
            label="H2"
            icon={Heading2}
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          />
          <TBtn
            label="H3"
            icon={Heading3}
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          />
          <TBtn
            label="Body"
            icon={Type}
            onClick={() => editor.chain().focus().setParagraph().run()}
            active={editor.isActive("paragraph")}
          />
        </Row>
      </Section>

      <Section title="List">
        <Row>
          <TBtn
            label="Bullet"
            icon={List}
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <TBtn
            label="Numbered"
            icon={ListOrdered}
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <TBtn
            label="Tasks"
            icon={ListTodo}
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
          />
        </Row>
      </Section>

      <Section title="Block">
        <Row>
          <TBtn
            label="Quote"
            icon={Quote}
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          />
          <TBtn
            label="Code"
            icon={Code2}
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          />
          <TBtn
            label="Rule"
            icon={Minus}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          />
        </Row>
      </Section>

      <Section title="Align">
        <Row>
          <TBtn
            label="Left"
            icon={AlignLeft}
            active={editor.isActive({ textAlign: "left" })}
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
          />
          <TBtn
            label="Center"
            icon={AlignCenter}
            active={editor.isActive({ textAlign: "center" })}
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
          />
          <TBtn
            label="Right"
            icon={AlignRight}
            active={editor.isActive({ textAlign: "right" })}
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
          />
        </Row>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="px-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-3">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function TBtn({
  label,
  icon,
  onClick,
  active,
  disabled,
}: {
  label: string;
  icon: typeof Bold;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md border transition-all duration-150",
        active
          ? "border-accent bg-accent-tint text-accent"
          : "border-border-subtle bg-surface-raised text-fg-2 hover:bg-surface-2 hover:text-fg-1",
        disabled && "opacity-40 pointer-events-none",
      )}
    >
      <Icon icon={icon} size={13} />
    </button>
  );
}
