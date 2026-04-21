import type { Config } from "tailwindcss";

/**
 * Tailwind references the Atlas design tokens declared in
 * `design-system/colors_and_type.css`. Tokens are the source of truth — this
 * config is a thin bridge so we can use `bg-surface-1`, `text-fg-2`, etc.
 * Dark mode is activated via `[data-theme="dark"]` on <html>.
 */
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-app": "var(--surface-app)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        "surface-hover": "var(--surface-hover)",
        "surface-press": "var(--surface-press)",
        "surface-raised": "var(--surface-raised)",
        "surface-inverse": "var(--surface-inverse)",
        "fg-1": "var(--fg-1)",
        "fg-2": "var(--fg-2)",
        "fg-3": "var(--fg-3)",
        "fg-4": "var(--fg-4)",
        "fg-on-accent": "var(--fg-on-accent)",
        "fg-inverse": "var(--fg-inverse)",
        accent: "var(--accent-primary)",
        "accent-hover": "var(--accent-primary-hover)",
        "accent-press": "var(--accent-primary-press)",
        "accent-tint": "var(--accent-tint)",
        "border-subtle": "var(--border-subtle)",
        "border-strong": "var(--border-strong)",
        "border-input": "var(--border-input)",
        "success-fg": "var(--success-fg)",
        "success-bg": "var(--success-bg)",
        "warning-fg": "var(--warning-fg)",
        "warning-bg": "var(--warning-bg)",
        "danger-fg": "var(--danger-fg)",
        "danger-bg": "var(--danger-bg)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
        4: "var(--shadow-4)",
        focus: "var(--shadow-focus)",
      },
      fontFamily: {
        display: "var(--font-display)",
        ui: "var(--font-ui)",
        serif: "var(--font-serif)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        xs: "var(--text-xs)",
        sm: "var(--text-sm)",
        base: "var(--text-base)",
        md: "var(--text-md)",
        lg: "var(--text-lg)",
        xl: "var(--text-xl)",
        "2xl": "var(--text-2xl)",
        "3xl": "var(--text-3xl)",
        "4xl": "var(--text-4xl)",
        "5xl": "var(--text-5xl)",
        "6xl": "var(--text-6xl)",
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        5: "var(--space-5)",
        6: "var(--space-6)",
        7: "var(--space-7)",
        8: "var(--space-8)",
        9: "var(--space-9)",
        10: "var(--space-10)",
        11: "var(--space-11)",
      },
      maxWidth: {
        reading: "var(--content-max-reading)",
      },
    },
  },
  plugins: [],
};

export default config;
