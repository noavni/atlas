"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-8 w-full rounded-sm border border-border-input bg-surface-raised px-2.5 text-base text-fg-1 placeholder:text-fg-4",
        "outline-none transition-[box-shadow,border-color] duration-150",
        "hover:border-border-strong focus-visible:border-accent focus-visible:shadow-focus",
        className,
      )}
      {...props}
    />
  );
});
