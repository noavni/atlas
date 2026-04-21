"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { PAGE_TRANSITION } from "@/lib/motion";

/**
 * Wrap authed-route content so each navigation cross-fades with a 6px
 * spatial slide, matching the design brief.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={PAGE_TRANSITION}
        className="flex h-full min-h-0 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
