"use client";

import { cn } from "@/lib/utils";

/**
 * The animated Atlas sphere logomark.
 *
 * Faithfully ports `design-system/reference/preview/brand-logo.html`:
 *   - radial-gradient orb (sph) — indigo core, bright highlight upper-left
 *   - two orbital arcs counter-rotating (arc, arc-b)
 *   - a drifting specular highlight (hi) that breathes
 *   - a halo glow behind the sphere pulsing on a 4.2s spring
 *   - the whole orb floats 1.5px vertically on a 6s cycle
 *
 * All animation is CSS-based so Framer Motion overhead is zero. The
 * gradients are registered once (global SVG defs) and referenced via id.
 */

export interface AtlasLogoProps {
  size?: number;
  withHalo?: boolean;
  className?: string;
}

export function AtlasLogo({ size = 28, withHalo = true, className }: AtlasLogoProps) {
  return (
    <span className={cn("atlas-sphere", className)} style={{ width: size, height: size }}>
      {withHalo && <span className="atlas-halo" aria-hidden="true" />}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Atlas"
        style={{ display: "block", overflow: "visible" }}
      >
        <g className="atlas-orb">
          <circle
            className="atlas-glow"
            cx="32"
            cy="32"
            r="26"
            fill="url(#atlas-sph)"
          />
          <ellipse
            className="atlas-arc"
            cx="32"
            cy="32"
            rx="26"
            ry="9"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth={size < 24 ? 1 : 0.8}
          />
          {size >= 24 && (
            <ellipse
              className="atlas-arc-b"
              cx="32"
              cy="32"
              rx="26"
              ry="15"
              fill="none"
              stroke="rgba(255,255,255,0.32)"
              strokeWidth="0.7"
            />
          )}
          <circle cx="32" cy="32" r="26" fill="url(#atlas-rim)" />
          <ellipse
            className="atlas-hi"
            cx="24"
            cy="22"
            rx="8"
            ry="5"
            fill="url(#atlas-hi)"
          />
        </g>
      </svg>
    </span>
  );
}

/**
 * Mount once in the root layout — provides the gradient defs every AtlasLogo
 * instance reuses by id. The <svg> here is zero-size and ARIA-hidden.
 */
export function AtlasLogoDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <radialGradient id="atlas-sph" cx="38%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#D7DCFF" />
          <stop offset="32%" stopColor="#8E9AF5" />
          <stop offset="68%" stopColor="#4B5BE8" />
          <stop offset="100%" stopColor="#1F2672" />
        </radialGradient>
        <radialGradient id="atlas-hi" cx="38%" cy="28%" r="26%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <radialGradient id="atlas-rim" cx="50%" cy="50%" r="50%">
          <stop offset="78%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

export function AtlasWordmark({
  size = 26,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("font-display font-semibold tracking-[-0.028em] text-fg-1", className)}
      style={{ fontSize: size }}
    >
      Atlas
    </span>
  );
}
