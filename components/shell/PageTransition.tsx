"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { PAGE_TRANSITION } from "@/lib/motion";

/**
 * Wrap authed-route content so each navigation cross-fades with a
 * short spatial slide + subtle scale. Matches the "native desktop app"
 * feel we're chasing — never too long, never too heavy.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className="flex h-full min-h-0 flex-col">{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -4, scale: 0.998 }}
        transition={PAGE_TRANSITION}
        className="flex h-full min-h-0 flex-col"
        style={{ transformOrigin: "50% 0%", willChange: "transform, opacity" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
