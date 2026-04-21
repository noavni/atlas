"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export interface AppShellProps {
  crumbs: string[];
  children: React.ReactNode;
}

export function AppShell({ crumbs, children }: AppShellProps) {
  return (
    <div className="grid h-screen overflow-hidden bg-surface-app text-fg-1"
         style={{ gridTemplateColumns: "var(--sidebar-expanded) 1fr" }}>
      <Sidebar />
      <main className="flex min-h-0 min-w-0 flex-col bg-surface-app">
        <Topbar crumbs={crumbs} />
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
