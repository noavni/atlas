"use client";

import dynamic from "next/dynamic";

/**
 * Tiptap + ProseMirror are ~50KB min-gzipped. Lazy-load so they never
 * enter the shared chunks served to /inbox, /board, /graph, etc.
 */
export const NoteEditor = dynamic(
  () => import("./NoteEditor").then((m) => m.NoteEditor),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[50vh] animate-pulse rounded-md bg-surface-2/40" />
    ),
  },
);
