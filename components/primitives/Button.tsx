"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-7 px-2.5 text-sm gap-1.5",
  md: "h-8 px-3 text-base gap-2",
  lg: "h-10 px-4 text-md gap-2",
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent text-fg-on-accent shadow-1 hover:bg-accent-hover active:bg-accent-press",
  secondary:
    "bg-surface-raised text-fg-1 shadow-1 border border-border-subtle hover:bg-surface-2",
  ghost: "bg-transparent text-fg-2 hover:bg-surface-hover hover:text-fg-1",
  danger:
    "bg-danger-bg text-danger-fg hover:bg-danger-fg hover:text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = "secondary",
    size = "md",
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-sm font-ui font-medium outline-none transition-[background-color,color,box-shadow,transform] duration-150 ease-in-out",
        "active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40",
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {leadingIcon}
      {children && <span className="leading-none">{children}</span>}
      {trailingIcon}
    </button>
  );
});
