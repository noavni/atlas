"use client";

import { useEffect } from "react";
import { useUI } from "@/lib/store/ui";

/**
 * Syncs Zustand UI state to the <html> element:
 *  - data-theme="dark" | "light"
 *  - dir="ltr" | "rtl"
 *
 * Runs once on mount and whenever theme/dir change. Zustand persist handles
 * hydration; before hydration the server-rendered HTML uses the defaults in
 * app/layout.tsx so there is no flash for first-time visitors.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUI((s) => s.theme);
  const dir = useUI((s) => s.dir);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    html.setAttribute("dir", dir);
  }, [theme, dir]);

  return <>{children}</>;
}
