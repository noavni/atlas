"use client";

import { create } from "zustand";

interface CardEditorState {
  cardId: string | null;
  open: (id: string) => void;
  close: () => void;
}

export const useCardEditor = create<CardEditorState>((set) => ({
  cardId: null,
  open: (id) => set({ cardId: id }),
  close: () => set({ cardId: null }),
}));
