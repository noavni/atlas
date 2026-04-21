"use client";

import type { LucideIcon, LucideProps } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Atlas icon wrapper around Lucide.
 * Spec: 1.75px stroke, 20px default, currentColor. Icons sit on the text baseline.
 */
export interface IconProps extends Omit<LucideProps, "ref"> {
  icon: LucideIcon;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
  { icon: LucideComponent, size = 20, strokeWidth = 1.75, className, ...props },
  ref,
) {
  return (
    <LucideComponent
      ref={ref}
      size={size}
      strokeWidth={strokeWidth}
      className={cn("flex-none", className)}
      aria-hidden="true"
      {...props}
    />
  );
});
