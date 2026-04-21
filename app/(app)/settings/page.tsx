"use client";

import { AppShell } from "@/components/shell/AppShell";
import { PageHeading } from "@/components/shell/PageHeading";
import { Button } from "@/components/primitives/Button";
import { useUI } from "@/lib/store/ui";

export default function SettingsPage() {
  const theme = useUI((s) => s.theme);
  const dir = useUI((s) => s.dir);
  const toggleTheme = useUI((s) => s.toggleTheme);
  const toggleDir = useUI((s) => s.toggleDir);

  return (
    <AppShell crumbs={["Atlas", "Settings"]}>
      <div className="mx-auto max-w-[680px] px-7 pb-12 pt-7">
        <PageHeading title="Settings" />

        <section className="mt-4 flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-raised p-5 shadow-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-base font-medium text-fg-1">Appearance</div>
              <div className="mt-0.5 text-sm text-fg-3">
                Currently {theme}. Matches the system when no preference is saved.
              </div>
            </div>
            <Button variant="secondary" onClick={toggleTheme}>
              Switch to {theme === "dark" ? "light" : "dark"}
            </Button>
          </div>
        </section>

        <section className="mt-3 flex flex-col gap-3 rounded-md border border-border-subtle bg-surface-raised p-5 shadow-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-base font-medium text-fg-1">Writing direction</div>
              <div className="mt-0.5 text-sm text-fg-3">
                Currently {dir.toUpperCase()}. Full layout mirrors in Hebrew.
              </div>
            </div>
            <Button variant="secondary" onClick={toggleDir}>
              Switch to {dir === "rtl" ? "LTR" : "RTL"}
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
