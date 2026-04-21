"use client";

import { LayoutGrid } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";

export default function BoardIndexPage() {
  return (
    <AppShell crumbs={["Atlas", "Boards"]}>
      <div className="px-7 pb-12 pt-7">
        <PageHeading title="Boards" />
        <EmptyState
          icon={<Icon icon={LayoutGrid} size={28} />}
          title="Pick a project from the sidebar."
          hint="Boards live under each project."
        />
      </div>
    </AppShell>
  );
}
