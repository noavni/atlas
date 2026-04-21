/**
 * Spring presets — mirror the JS values in
 * `design-system/reference/motion_proto/motion.jsx`. Use these everywhere
 * we reach for Framer Motion so every surface feels the same.
 */

import type { Transition } from "framer-motion";

export const SPRING = {
  drag: { type: "spring", stiffness: 220, damping: 26, mass: 1 } as const,
  panel: { type: "spring", stiffness: 260, damping: 30 } as const,
  bounce: { type: "spring", stiffness: 400, damping: 15 } as const,
  gentle: { type: "spring", stiffness: 180, damping: 22 } as const,
  stiff: { type: "spring", stiffness: 500, damping: 30 } as const,
} satisfies Record<string, Transition>;

/** Cross-fade + 6px slide used for route transitions. */
export const PAGE_TRANSITION: Transition = {
  duration: 0.25,
  ease: [0.22, 1, 0.36, 1],
};
