"use client";

import { cn } from "@/lib/utils";

export interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  inverse?: boolean;
}

export function Kbd({ className, inverse = false, children, ...props }: KbdProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-xs border px-1.5 py-px font-mono text-[10.5px] font-medium",
        inverse
          ? "border-transparent bg-white/15 text-[inherit]"
          : "border-border-subtle bg-surface-2 text-fg-2",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
