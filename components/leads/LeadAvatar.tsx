"use client";

import { avatarInitials } from "@/lib/leads";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

interface Props {
  lead: Pick<Lead, "name" | "avatar_initials" | "avatar_color">;
  size?: number;
  className?: string;
}

/**
 * Colored circle with initials. Uses `avatar_color` as the deterministic
 * base color; if it's a hex we blend to a gradient for a richer surface.
 */
export function LeadAvatar({ lead, size = 32, className }: Props) {
  const color = lead.avatar_color || "#3D49F5";
  const fontSize = Math.round(size * 0.4);
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full text-white shadow-1",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${lightenHex(color, 0.1)}, ${color})`,
        fontSize,
        fontWeight: 600,
        letterSpacing: "-0.01em",
      }}
      aria-hidden="true"
    >
      {avatarInitials(lead)}
    </span>
  );
}

function lightenHex(hex: string, amount: number): string {
  try {
    const m = /^#([0-9a-f]{6})$/i.exec(hex);
    if (!m) return hex;
    const n = parseInt(m[1]!, 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (n & 0xff) + Math.round(255 * amount));
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  } catch {
    return hex;
  }
}
