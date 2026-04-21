"use client";

import { create } from "zustand";
import type { Editor } from "@tiptap/react";

interface State {
  editor: Editor | null;
  /** Bump this every time the editor state changes so subscribers re-render. */
  tick: number;
  setEditor: (e: Editor | null) => void;
  notify: () => void;
}

export const useActiveEditor = create<State>((set) => ({
  editor: null,
  tick: 0,
  setEditor: (e) => set({ editor: e, tick: 0 }),
  notify: () => set((s) => ({ tick: s.tick + 1 })),
}));
