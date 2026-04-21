"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { v4 as uuid } from "uuid";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Folder,
  Inbox as InboxIcon,
  LayoutGrid,
  Network,
  NotebookPen,
  Plus,
  Settings as SettingsIcon,
  Users,
} from "lucide-react";
import { AtlasLogo } from "@/components/brand/AtlasLogo";
import { Icon } from "@/components/primitives/Icon";
import { Badge } from "@/components/primitives/Badge";
import { SPRING } from "@/lib/motion";
import { useInbox } from "@/lib/queries/inbox";
import { useLeads } from "@/lib/queries/leads";
import { useMe } from "@/lib/queries/me";
import { usePages } from "@/lib/queries/pages";
import { useProjects, useUpdateProject } from "@/lib/queries/projects";
import type { Project } from "@/lib/types";
import { useCreatePage } from "@/lib/queries/pages";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useProjectColors } from "@/lib/store/projectColors";
import { useUI } from "@/lib/store/ui";

// Deterministic dot colors picked from the token palette so each project
// gets a distinct visual identifier.
const DOT_PALETTE = [
  "var(--persimmon-500)",
  "var(--sage-500)",
  "var(--indigo-500)",
  "var(--amber-500)",
  "var(--apricot-500)",
];

function dotColorFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return DOT_PALETTE[hash % DOT_PALETTE.length]!;
}

interface NavEntry {
  id: string;
  href: string;
  icon: typeof InboxIcon;
  label: string;
  badge?: number;
}

const primaryNav: NavEntry[] = [
  { id: "inbox", href: "/inbox", icon: InboxIcon, label: "Inbox" },
  { id: "board", href: "/board", icon: LayoutGrid, label: "Boards" },
  { id: "notes", href: "/notes", icon: NotebookPen, label: "Notes" },
  { id: "leads", href: "/leads", icon: Users, label: "Leads" },
  { id: "graph", href: "/graph", icon: Network, label: "Graph" },
];


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
      prefetch
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
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING.gentle}
            className="mt-1 flex flex-col gap-px overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const projects = useProjects(workspaceId);
  const pages = usePages(workspaceId);
  const inbox = useInbox(workspaceId);
  const leads = useLeads(workspaceId);
  const pinnedPages = pages.data?.slice(0, 5) ?? [];
  const visibleProjects = projects.data ?? [];
  const createPage = useCreatePage();
  const router = useRouter();
  const setNewProjectOpen = useUI((s) => s.setNewProjectOpen);
  const getProjectColor = useProjectColors((s) => s.getColor);

  const badges: Record<string, number | undefined> = {
    inbox: inbox.data?.length,
    leads: leads.data?.filter((l) => l.stage !== "won" && l.stage !== "lost").length,
  };

  function onNewProject() {
    setNewProjectOpen(true);
  }

  function onNewPinnedNote() {
    if (!workspaceId || createPage.isPending) return;
    const taken = new Set((pages.data ?? []).map((p) => p.title));
    let t = "Untitled";
    if (taken.has(t)) {
      for (let n = 2; n < 1000; n++) {
        if (!taken.has(`Untitled ${n}`)) {
          t = `Untitled ${n}`;
          break;
        }
      }
    }
    const id = uuid();
    // Navigate immediately; the optimistic cache insertion in useCreatePage
    // makes the new note routable before the server responds.
    router.push(`/notes/${encodeURIComponent(t)}`);
    createPage.mutate({ workspaceId, title: t, id });
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sidebar-expanded)] flex-col overflow-hidden bg-surface-app px-2.5 pb-2.5 pt-3.5",
        "border-e border-border-subtle",
      )}
    >
      <div className="px-1.5 pb-3 pt-1.5">
        <div className="flex items-center gap-3 rounded-[10px] p-1.5 transition-colors hover:bg-surface-2">
          <AtlasLogo size={36} />
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
            badge={badges[e.id]}
            active={pathname === e.href || pathname.startsWith(e.href + "/")}
          />
        ))}
      </nav>

      <Section title="Projects" onAdd={onNewProject}>
        {visibleProjects.length === 0 && !projects.isLoading && (
          <div className="px-2.5 py-1.5 text-[12px] text-fg-3">No projects yet.</div>
        )}
        {visibleProjects.map((p) => (
          <ProjectRow
            key={p.id}
            project={p}
            workspaceId={workspaceId}
            dotColor={getProjectColor(p.id) ?? dotColorFor(p.id)}
          />
        ))}
      </Section>

      {pinnedPages.length > 0 && (
        <Section title="Pinned notes" onAdd={onNewPinnedNote}>
          {pinnedPages.map((n) => (
            <Link
              key={n.id}
              href={`/notes/${encodeURIComponent(n.title)}`}
              prefetch
              className="flex items-center gap-2.5 rounded-sm px-2.5 py-[5px] ps-6 text-[12.5px] text-fg-2 transition-colors hover:bg-surface-hover hover:text-fg-1"
            >
              <Icon icon={Folder} size={14} />
              <span className="truncate">{n.title}</span>
            </Link>
          ))}
        </Section>
      )}

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

function ProjectRow({
  project,
  workspaceId,
  dotColor,
}: {
  project: Project;
  workspaceId: string | undefined;
  dotColor: string;
}) {
  const update = useUpdateProject();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const pathname = usePathname();
  const active =
    pathname === `/board/${project.id}` || pathname.startsWith(`/board/${project.id}/`);

  function commit() {
    const next = name.trim();
    if (!next || !workspaceId || next === project.name) {
      setName(project.name);
      setEditing(false);
      return;
    }
    update.mutate({ workspaceId, projectId: project.id, patch: { name: next } });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2.5 px-2.5 py-[5px] ps-6">
        <span
          className="h-3.5 w-3.5 flex-none rounded-full shadow-1 ring-1 ring-inset ring-black/10"
          style={{ background: dotColor }}
          aria-hidden="true"
        />
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") {
              setName(project.name);
              setEditing(false);
            }
          }}
          className="min-w-0 flex-1 rounded-sm border border-accent bg-surface-raised px-1.5 py-px text-[12.5px] text-fg-1 outline-none"
        />
      </div>
    );
  }

  return (
    <Link
      href={`/board/${project.id}`}
      prefetch
      onDoubleClick={(e) => {
        e.preventDefault();
        setEditing(true);
      }}
      className={cn(
        "group flex items-center gap-2.5 rounded-sm px-2.5 py-[5px] ps-6 text-[12.5px] transition-colors",
        active ? "bg-accent-tint text-fg-1" : "text-fg-2 hover:bg-surface-hover hover:text-fg-1",
      )}
      title="Double-click to rename"
    >
      <span
        className="h-3.5 w-3.5 flex-none rounded-full shadow-1 ring-1 ring-inset ring-black/10 transition-transform duration-200 group-hover:scale-110"
        style={{ background: dotColor }}
        aria-hidden="true"
      />
      <span className="truncate">{project.name}</span>
    </Link>
  );
}
