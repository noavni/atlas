"use client";

import { Languages, Moon, Search, Sparkles, Sun } from "lucide-react";
import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/primitives/Icon";
import { IconButton } from "@/components/primitives/IconButton";
import { Kbd } from "@/components/primitives/Kbd";
import { cn } from "@/lib/utils";
import { useUI } from "@/lib/store/ui";

export interface TopbarProps {
  crumbs: string[];
  userName?: string;
}

export function Topbar({ crumbs, userName = "Atlas" }: TopbarProps) {
  const theme = useUI((s) => s.theme);
  const toggleTheme = useUI((s) => s.toggleTheme);
  const dir = useUI((s) => s.dir);
  const toggleDir = useUI((s) => s.toggleDir);
  const setCommandPaletteOpen = useUI((s) => s.setCommandPaletteOpen);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-[var(--topbar-height)] items-center gap-3.5 px-4",
        "border-b border-border-subtle",
      )}
      style={{
        background: "var(--material-thick)",
        backdropFilter: "blur(24px) saturate(140%)",
        WebkitBackdropFilter: "blur(24px) saturate(140%)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2.5 text-[12.5px] text-fg-2">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2.5">
            <span
              className={cn(
                "whitespace-nowrap",
                i === crumbs.length - 1 ? "font-medium text-fg-1" : "",
              )}
            >
              {c}
            </span>
            {i < crumbs.length - 1 && <span className="text-fg-4">/</span>}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setCommandPaletteOpen(true)}
        className={cn(
          "mx-auto flex h-[30px] max-w-[440px] flex-1 items-center gap-2 rounded-sm border border-border-subtle bg-surface-2 px-2.5",
          "text-[12.5px] text-fg-3 transition-colors duration-150",
          "hover:bg-surface-3 hover:text-fg-2",
        )}
      >
        <Icon icon={Search} size={14} />
        <span>Search or jump to…</span>
        <span className="ms-auto">
          <Kbd>⌘K</Kbd>
        </span>
      </button>

      <div className="ms-auto flex items-center gap-1.5">
        <IconButton
          onClick={toggleDir}
          title="Toggle RTL"
          style={{ opacity: dir === "rtl" ? 1 : 0.55 }}
        >
          <Icon icon={Languages} size={16} />
        </IconButton>
        <IconButton onClick={toggleTheme} title="Toggle theme">
          <Icon icon={theme === "dark" ? Sun : Moon} size={16} />
        </IconButton>
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className={cn(
            "inline-flex h-[30px] items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3",
            "font-ui text-[12.5px] font-medium text-fg-1 shadow-1",
            "transition-[background-color,transform] duration-150 hover:bg-surface-2 active:scale-[0.96]",
          )}
        >
          <Icon icon={Sparkles} size={14} />
          <span>Ask</span>
        </button>
        <Avatar name={userName} size="md" />
      </div>
    </header>
  );
}
