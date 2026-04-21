"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAP: Record<string, string> = {
  indigo: "var(--indigo-500)",
  apricot: "var(--apricot-500)",
  sage: "var(--sage-500)",
  amber: "var(--amber-500)",
  persimmon: "var(--persimmon-500)",
};

interface State {
  colors: Record<string, string>;
  setColor: (projectId: string, colorKey: string) => void;
  getColor: (projectId: string) => string | undefined;
}

export const useProjectColors = create<State>()(
  persist(
    (set, get) => ({
      colors: {},
      setColor: (projectId, colorKey) =>
        set((s) => ({ colors: { ...s.colors, [projectId]: colorKey } })),
      getColor: (projectId) => {
        const k = get().colors[projectId];
        return k ? MAP[k] : undefined;
      },
    }),
    { name: "atlas-project-colors" },
  ),
);

export function resolveProjectColor(colorKey: string | undefined): string | undefined {
  if (!colorKey) return undefined;
  return MAP[colorKey];
}
