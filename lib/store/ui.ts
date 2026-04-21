"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";
export type Direction = "ltr" | "rtl";

interface UIState {
  theme: Theme;
  dir: Direction;
  sidebarExpanded: boolean;
  commandPaletteOpen: boolean;
  quickCaptureOpen: boolean;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setDir: (d: Direction) => void;
  toggleDir: () => void;
  setSidebarExpanded: (v: boolean) => void;
  setCommandPaletteOpen: (v: boolean) => void;
  setQuickCaptureOpen: (v: boolean) => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: "light",
      dir: "ltr",
      sidebarExpanded: true,
      commandPaletteOpen: false,
      quickCaptureOpen: false,
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
      setDir: (d) => set({ dir: d }),
      toggleDir: () => set({ dir: get().dir === "rtl" ? "ltr" : "rtl" }),
      setSidebarExpanded: (v) => set({ sidebarExpanded: v }),
      setCommandPaletteOpen: (v) => set({ commandPaletteOpen: v }),
      setQuickCaptureOpen: (v) => set({ quickCaptureOpen: v }),
    }),
    {
      name: "atlas-ui",
      partialize: (state) => ({
        theme: state.theme,
        dir: state.dir,
        sidebarExpanded: state.sidebarExpanded,
      }),
    },
  ),
);
