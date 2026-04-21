"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef } from "react";
import { buildMentionSuggestion } from "./mentionSuggestion";
import { useLeads } from "@/lib/queries/leads";
import { useMe } from "@/lib/queries/me";
import { useUpdatePage, type PageDoc } from "@/lib/queries/pages";
import type { Lead } from "@/lib/types";

export interface NoteEditorProps {
  page: PageDoc;
}

/**
 * Block-based editor backed by Tiptap (ProseMirror). The full doc JSON lives
 * in `pages.content`; we persist on blur and on a 1.5s debounce while typing.
 *
 * Block IDs are managed server-side on save — we don't embed `attrs.id` yet
 * (the extractor generates UUIDs for blocks without ids, and on next read
 * the client just rehydrates from the JSON the backend persisted). Phase 3
 * will add a Tiptap extension that assigns stable ids to block-level nodes
 * the moment they're created so block-granular backlinks survive rewrites.
 */
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
        HTMLAttributes: {
          class:
            "atlas-mention inline-flex items-center gap-1 rounded-full bg-accent-tint px-2 py-0.5 text-[0.85em] font-medium text-accent no-underline cursor-pointer",
        },
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
        placeholder: "Start writing… (type @ to link a lead)",
        emptyEditorClass: "is-editor-empty",
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      mentionExtension,
    ],
    content: page.content as object,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-atlas focus:outline-none font-serif text-[18px] leading-[1.6] text-fg-1 min-h-[50vh]",
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
          {
            onSuccess: (p) => {
              versionRef.current = p.version;
            },
          },
        );
      }, 1500);
    },
    onBlur({ editor }) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const doc = editor.getJSON();
      updatePage.mutate(
        { pageId: page.id, version: versionRef.current, content: doc },
        {
          onSuccess: (p) => {
            versionRef.current = p.version;
          },
        },
      );
    },
  });

  // Keep version ref in sync when the server bumps it via realtime.
  useEffect(() => {
    versionRef.current = page.version;
  }, [page.version]);

  // Clean up pending debounce on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!editor) return null;
  return <EditorContent editor={editor} />;
}
