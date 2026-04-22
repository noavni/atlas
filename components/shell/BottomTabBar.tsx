"use client";

import { Inbox, NotebookPen, Network, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/primitives/Icon";
import { cn } from "@/lib/utils";

/**
 * Floating pill at the bottom of the viewport with the five primary surfaces.
 * Matches `.screen-tabs` from the handoff prototype — glass material, pill
 * radius, active item filled with --accent-primary.
 */
const TABS = [
  { id: "inbox", label: "Inbox", href: "/inbox", icon: Inbox },
  { id: "notes", label: "Notes", href: "/notes", icon: NotebookPen },
  { id: "leads", label: "Leads", href: "/leads", icon: Users },
  { id: "graph", label: "Graph", href: "/graph", icon: Network },
] as const;

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border-subtle p-1 shadow-3",
      )}
      style={{
        background: "var(--material-thick)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
      }}
    >
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.id}
            href={t.href}
            prefetch
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5",
              "font-ui text-[12.5px] font-medium transition-colors duration-150",
              active
                ? "bg-accent text-fg-on-accent shadow-1"
                : "text-fg-2 hover:bg-surface-hover hover:text-fg-1",
            )}
          >
            <Icon icon={t.icon} size={14} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
