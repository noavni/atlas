"use client";

import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: "xs" | "sm" | "md";
  src?: string;
}

const sizeClasses = {
  xs: "w-[18px] h-[18px] text-[9.5px]",
  sm: "w-[22px] h-[22px] text-[10.5px]",
  md: "w-[26px] h-[26px] text-[11px]",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function Avatar({ className, name, size = "md", src, ...props }: AvatarProps) {
  if (src) {
    return (
      <span
        className={cn(
          "inline-flex flex-none items-center justify-center overflow-hidden rounded-full",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center justify-center rounded-full bg-accent font-semibold text-fg-on-accent",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {initials(name)}
    </span>
  );
}
