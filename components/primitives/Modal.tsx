"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  /** Small text shown under the title. */
  subtitle?: string;
  /** Fixed-width footer. When omitted, the modal hides its action bar. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
  /** Replace the entire header (icon + title + close) with custom content. */
  headerOverride?: React.ReactNode;
}

const WIDTHS = {
  sm: "max-w-[440px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
} as const;

/**
 * Shared Apple-style modal shell. Used by New project / New lead / Import
 * leads / Card editor etc. Style goals:
 *  - large radius (20px)
 *  - ~92vh ceiling, flex-column with scrollable body so long forms work
 *  - backdrop blur on the dim layer
 *  - soft spring open, cross-fade close
 *  - no heavy dividers — just negative space + a quiet hairline at the footer
 */
export function Modal({
  open,
  onClose,
  title,
  icon,
  subtitle,
  footer,
  children,
  width = "md",
  headerOverride,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto px-4 py-[4vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <div
            className="absolute inset-0 bg-black/40"
            style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="atlas-modal-title"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.99 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.9 }}
            className={cn(
              "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[14px] bg-surface-raised",
              // Layered macOS-style shadow: hairline ring + soft drop + ambient
              "shadow-[0_0_0_0.5px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06),0_24px_56px_-16px_rgba(0,0,0,0.32)]",
              "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06),0_24px_56px_-16px_rgba(0,0,0,0.55)]",
              WIDTHS[width],
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {headerOverride ? (
              headerOverride
            ) : (
              <div className="flex flex-none items-start gap-2.5 px-6 pb-3 pt-5">
                {icon && (
                  <span
                    className="mt-[3px] flex h-7 w-7 flex-none items-center justify-center rounded-[8px] bg-accent-tint text-accent"
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h2
                    id="atlas-modal-title"
                    className="truncate font-display text-[17px] font-semibold leading-[1.2] tracking-[-0.01em] text-fg-1"
                  >
                    {title}
                  </h2>
                  {subtitle && (
                    <div className="mt-0.5 text-[12.5px] leading-[1.4] text-fg-3">
                      {subtitle}
                    </div>
                  )}
                </div>
                <IconButton
                  className="-me-2 -mt-1 flex-none"
                  size="sm"
                  title="Close"
                  onClick={onClose}
                >
                  <Icon icon={X} size={13} />
                </IconButton>
              </div>
            )}

            <div className="atlas-board-scroll flex-1 overflow-y-auto px-6 pb-4">
              {children}
            </div>

            {footer && (
              <div className="flex flex-none items-center gap-2 px-6 py-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
