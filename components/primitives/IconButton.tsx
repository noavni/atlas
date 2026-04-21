"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "xs" | "sm" | "md";
}

const sizeClasses = {
  xs: "w-[22px] h-[22px] rounded-[5px]",
  sm: "w-[26px] h-[26px] rounded-[6px]",
  md: "w-[30px] h-[30px] rounded-[7px]",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, size = "md", type = "button", children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center bg-transparent text-fg-2",
        "transition-[background-color,color,transform] duration-150",
        "hover:bg-surface-hover hover:text-fg-1 active:scale-[0.92]",
        "disabled:pointer-events-none disabled:opacity-40",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});
