"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ChevronDown,
  Folder,
  Inbox as InboxIcon,
  LayoutGrid,
  Network,
  NotebookPen,
  Plus,
  Settings as SettingsIcon,
} from "lucide-react";
import { Icon } from "@/components/primitives/Icon";
import { Badge } from "@/components/primitives/Badge";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/store/ui";

interface NavEntry {
  id: string;
  href: string;
  icon: typeof InboxIcon;
  label: string;
  badge?: number;
}

const primaryNav: NavEntry[] = [
  { id: "inbox", href: "/inbox", icon: InboxIcon, label: "Inbox", badge: 0 },
  { id: "board", href: "/board", icon: LayoutGrid, label: "Boards" },
  { id: "notes", href: "/notes", icon: NotebookPen, label: "Notes" },
  { id: "graph", href: "/graph", icon: Network, label: "Graph" },
];

const sampleProjects = [
  { id: "home", name: "Home renovation", color: "var(--persimmon-500)" },
  { id: "lisbon", name: "Trip to Lisbon", color: "var(--sage-500)" },
  { id: "reading", name: "Reading list 2026", color: "var(--indigo-500)" },
  { id: "garden", name: "Garden", color: "var(--amber-500)" },
];

const samplePinned = ["On quiet tools", "Paint palette", "Weekly review", "Books to buy"];

function NavItem({
  href,
  icon,
  label,
  badge,
  active,
}: {
  href: string;
  icon: typeof InboxIcon;
  label: string;
  badge?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-start",
        "font-ui text-[13.5px] font-medium transition-colors duration-150",
        "active:scale-[0.98]",
        active
          ? "bg-surface-2 text-fg-1 shadow-1 [&_svg]:text-accent"
          : "text-fg-2 hover:bg-surface-hover hover:text-fg-1",
      )}
    >
      <Icon icon={icon} size={16} />
      <span className="truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ms-auto">
          <Badge>{badge}</Badge>
        </span>
      )}
    </Link>
  );
}

function Section({
  title,
  defaultOpen = true,
  onAdd,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  onAdd?: () => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const dir = useUI((s) => s.dir);
  return (
    <div className="mt-3.5">
      <div className="flex items-center gap-1.5 px-2.5 py-1">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-1.5 text-start text-[11px] font-semibold uppercase tracking-[0.02em] text-fg-3 hover:text-fg-2"
        >
          <Icon
            icon={ChevronDown}
            size={12}
            style={{
              transform: open ? "rotate(0)" : dir === "rtl" ? "rotate(90deg)" : "rotate(-90deg)",
              transition: "transform 200ms var(--spring-gentle)",
            }}
          />
          <span>{title}</span>
        </button>
        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-5 w-5 items-center justify-center rounded-xs text-fg-3 hover:bg-surface-hover hover:text-fg-1"
            aria-label={`Add ${title}`}
          >
            <Icon icon={Plus} size={14} />
          </button>
        )}
      </div>
      {open && <div className="mt-1 flex flex-col gap-px">{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sidebar-expanded)] flex-col overflow-hidden bg-surface-app px-2.5 pb-2.5 pt-3.5",
        "border-e border-border-subtle",
      )}
    >
      <div className="px-1.5 pb-3 pt-1.5">
        <div className="flex items-center gap-2.5 rounded-[10px] p-1.5 transition-colors hover:bg-surface-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-accent text-fg-on-accent text-sm font-semibold">
            A
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-semibold text-fg-1">Atlas</div>
            <div className="mt-px truncate text-[11px] text-fg-3">Private workspace</div>
          </div>
        </div>
      </div>

      <nav className="mt-1.5 flex flex-col gap-px">
        {primaryNav.map((e) => (
          <NavItem
            key={e.id}
            href={e.href}
            icon={e.icon}
            label={e.label}
            badge={e.badge}
            active={pathname === e.href || pathname.startsWith(e.href + "/")}
          />
        ))}
      </nav>

      <Section title="Projects" onAdd={() => {}}>
        {sampleProjects.map((p) => (
          <Link
            key={p.id}
            href={`/board/${p.id}`}
            className="flex items-center gap-2.5 rounded-sm px-2.5 py-[5px] ps-6 text-[12.5px] text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
          >
            <span
              className="h-2 w-2 flex-none rounded-full"
              style={{ background: p.color }}
              aria-hidden="true"
            />
            <span className="truncate">{p.name}</span>
          </Link>
        ))}
      </Section>

      <Section title="Pinned notes">
        {samplePinned.map((n) => (
          <Link
            key={n}
            href={`/notes/${encodeURIComponent(n)}`}
            className="flex items-center gap-2.5 rounded-sm px-2.5 py-[5px] ps-6 text-[12.5px] text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
          >
            <Icon icon={Folder} size={14} />
            <span className="truncate">{n}</span>
          </Link>
        ))}
      </Section>

      <div className="mt-auto border-t border-border-subtle pt-2">
        <NavItem
          href="/settings"
          icon={SettingsIcon}
          label="Settings"
          active={pathname.startsWith("/settings")}
        />
      </div>
    </aside>
  );
}
