"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LeadView = "table" | "pipeline" | "timeline";

interface LeadsState {
  view: LeadView;
  setView: (v: LeadView) => void;
  drawerLeadId: string | null;
  openLeadDrawer: (id: string) => void;
  closeLeadDrawer: () => void;
  newLeadOpen: boolean;
  setNewLeadOpen: (v: boolean) => void;
  importOpen: boolean;
  setImportOpen: (v: boolean) => void;
}

export const useLeadsUI = create<LeadsState>()(
  persist(
    (set) => ({
      view: "table",
      setView: (v) => set({ view: v }),
      drawerLeadId: null,
      openLeadDrawer: (id) => set({ drawerLeadId: id }),
      closeLeadDrawer: () => set({ drawerLeadId: null }),
      newLeadOpen: false,
      setNewLeadOpen: (v) => set({ newLeadOpen: v }),
      importOpen: false,
      setImportOpen: (v) => set({ importOpen: v }),
    }),
    {
      name: "atlas-leads-ui",
      partialize: (s) => ({ view: s.view }),
    },
  ),
);
