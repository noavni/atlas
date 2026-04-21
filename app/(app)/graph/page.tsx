"use client";

import { Network } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";

export default function GraphPage() {
  return (
    <AppShell crumbs={["Atlas", "Graph"]}>
      <div className="px-7 pb-12 pt-7">
        <PageHeading title="Graph" />
        <EmptyState
          icon={<Icon icon={Network} size={28} />}
          title="Graph lands in Phase 4."
          hint="Every note becomes a node; edges follow backlinks."
        />
      </div>
    </AppShell>
  );
}
