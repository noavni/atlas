"use client";

import { CommandPalette } from "@/components/palette/CommandPalette";
import { QuickCapture } from "@/components/inbox/QuickCapture";
import { PrefetchBoot } from "@/components/providers/PrefetchBoot";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { PageTransition } from "./PageTransition";

export interface AppShellProps {
  crumbs: string[];
  children: React.ReactNode;
}

export interface AppShellProps2 {
  crumbs: string[];
  children: React.ReactNode;
  /** When true, the main viewport is a bounded flex container (for the
   * Kanban board where each column scrolls independently). When false
   * (default), the outer viewport scrolls the page content. */
  fullHeight?: boolean;
}

export function AppShell({
  crumbs,
  children,
  fullHeight = false,
}: AppShellProps & { fullHeight?: boolean }) {
  return (
    <div
      className="grid h-screen overflow-hidden bg-surface-app text-fg-1"
      style={{ gridTemplateColumns: "var(--sidebar-expanded) 1fr" }}
    >
      <PrefetchBoot />
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-col bg-surface-app">
        <Topbar crumbs={crumbs} />
        <div
          className={
            fullHeight
              ? "atlas-board-scroll flex min-h-0 flex-1 flex-col overflow-hidden"
              : "atlas-board-scroll flex-1 overflow-auto"
          }
        >
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
      <CommandPalette />
      <QuickCapture />
    </div>
  );
}
