"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { buildMentionSuggestion } from "./mentionSuggestion";
import { useActiveEditor } from "@/lib/store/activeEditor";
import { useLeads } from "@/lib/queries/leads";
import { useMe } from "@/lib/queries/me";
import { useUpdatePage, type PageDoc } from "@/lib/queries/pages";
import type { Lead } from "@/lib/types";

export interface NoteEditorProps {
  page: PageDoc;
}

export function NoteEditor({ page }: NoteEditorProps) {
  const updatePage = useUpdatePage();
  const versionRef = useRef(page.version);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const setActiveEditor = useActiveEditor((s) => s.setEditor);

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
        placeholder: "Start writing — @ to link a lead",
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "atlas-link" },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
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
          "prose-atlas focus:outline-none font-serif text-[18px] leading-[1.7] text-fg-1 min-h-[65vh]",
        // Auto direction per paragraph — Hebrew / Arabic switch to RTL
        // automatically, mixed content renders correctly.
        dir: "auto",
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

  // Register editor globally so the right-side NoteToolbar can drive it.
  useEffect(() => {
    setActiveEditor(editor);
    return () => {
      setActiveEditor(null);
    };
  }, [editor, setActiveEditor]);

  useEffect(() => {
    versionRef.current = page.version;
  }, [page.version]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!editor) return null;

  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between text-[11px] text-fg-4">
        <span>
          {words} words · {chars} chars
        </span>
        <span className="opacity-70">Saved automatically</span>
      </div>
    </div>
  );
}
