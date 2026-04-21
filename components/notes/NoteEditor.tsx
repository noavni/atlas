"use client";

import { BubbleMenu, EditorContent, FloatingMenu, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { buildMentionSuggestion } from "./mentionSuggestion";
import { Icon } from "@/components/primitives/Icon";
import { useLeads } from "@/lib/queries/leads";
import { useMe } from "@/lib/queries/me";
import { useUpdatePage, type PageDoc } from "@/lib/queries/pages";
import type { Lead } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface NoteEditorProps {
  page: PageDoc;
}

export function NoteEditor({ page }: NoteEditorProps) {
  const updatePage = useUpdatePage();
  const versionRef = useRef(page.version);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const leadsQuery = useLeads(workspaceId);
  const leadsRef = useRef<Lead[]>([]);
  useEffect(() => {
    leadsRef.current = leadsQuery.data ?? [];
  }, [leadsQuery.data]);

  const mentionExtension = useMemo(
    () =>
      Mention.configure({
        HTMLAttributes: { class: "atlas-mention" },
        renderText: ({ options, node }) =>
          `${options.suggestion.char}${node.attrs.label ?? node.attrs.id}`,
        suggestion: buildMentionSuggestion(leadsRef),
      }),
    [],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: "Start writing — / for commands, @ to link a lead",
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "atlas-link" },
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Typography,
      CharacterCount.configure({ limit: null }),
      TaskList,
      TaskItem.configure({ nested: true }),
      mentionExtension,
    ],
    content: page.content as object,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-atlas focus:outline-none font-serif text-[18px] leading-[1.65] text-fg-1 min-h-[50vh]",
      },
      handleClickOn(_view, _pos, node) {
        if (node.type.name === "mention" && node.attrs.id) {
          router.push(`/leads/${node.attrs.id}`);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const doc = editor.getJSON();
      timerRef.current = setTimeout(() => {
        updatePage.mutate(
          { pageId: page.id, version: versionRef.current, content: doc },
          { onSuccess: (p) => (versionRef.current = p.version) },
        );
      }, 1500);
    },
    onBlur({ editor }) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const doc = editor.getJSON();
      updatePage.mutate(
        { pageId: page.id, version: versionRef.current, content: doc },
        { onSuccess: (p) => (versionRef.current = p.version) },
      );
    },
  });

  useEffect(() => {
    versionRef.current = page.version;
  }, [page.version]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  if (!editor) return null;

  return (
    <div className="flex flex-col gap-4">
      <EditorContent editor={editor} />

      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 120,
          placement: "top",
          animation: "shift-away-subtle",
        }}
        shouldShow={({ editor, from, to }) => from !== to && !editor.isActive("mention")}
        className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-raised p-1 shadow-3"
      >
        <BubbleBtn
          label="Bold (⌘B)"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          icon={Bold}
        />
        <BubbleBtn
          label="Italic (⌘I)"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          icon={Italic}
        />
        <BubbleBtn
          label="Underline (⌘U)"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          icon={UnderlineIcon}
        />
        <BubbleBtn
          label="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          icon={Strikethrough}
        />
        <BubbleBtn
          label="Highlight"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive("highlight")}
          icon={Highlighter}
        />
        <BubbleBtn
          label="Code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          icon={Code2}
        />
        <div className="mx-0.5 h-5 w-px bg-border-subtle" />
        <BubbleBtn
          label="Link"
          onClick={promptLink}
          active={editor.isActive("link")}
          icon={LinkIcon}
        />
      </BubbleMenu>

      <FloatingMenu
        editor={editor}
        tippyOptions={{ duration: 120, placement: "left-start", offset: [0, 0] }}
        className="flex items-center gap-0.5 rounded-lg border border-border-subtle bg-surface-raised p-1 shadow-3"
      >
        <FloatBtn
          label="H1"
          icon={Heading1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        />
        <FloatBtn
          label="H2"
          icon={Heading2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <FloatBtn
          label="List"
          icon={List}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <FloatBtn
          label="1. List"
          icon={ListOrdered}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <FloatBtn
          label="Tasks"
          icon={ListTodo}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        />
        <FloatBtn
          label="Quote"
          icon={Quote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <FloatBtn
          label="Code block"
          icon={Code2}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
      </FloatingMenu>

      <EditorStatus editor={editor} />
    </div>
  );
}

function BubbleBtn({
  label,
  icon,
  onClick,
  active,
}: {
  label: string;
  icon: typeof Bold;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-md transition-colors",
        active ? "bg-accent-tint text-accent" : "text-fg-2 hover:bg-surface-hover hover:text-fg-1",
      )}
    >
      <Icon icon={icon} size={13} />
    </button>
  );
}

function FloatBtn({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: typeof Bold;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-md text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
    >
      <Icon icon={icon} size={13} />
    </button>
  );
}

function EditorStatus({ editor }: { editor: Editor }) {
  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;
  return (
    <div className="flex items-center justify-between text-[11px] text-fg-4">
      <span>{words} words · {chars} chars</span>
      <span className="opacity-70">Saved automatically</span>
    </div>
  );
}
