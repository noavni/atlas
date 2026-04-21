"use client";

import { Inbox } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Icon } from "@/components/primitives/Icon";

export default function InboxPage() {
  return (
    <AppShell crumbs={["Atlas", "Inbox"]}>
      <div className="px-7 pb-12 pt-7">
        <PageHeading eyebrow="Capture" title="Inbox" />
        <EmptyState
          icon={<Icon icon={Inbox} size={28} />}
          title="No captures yet."
          hint="Press ⌘N anywhere to drop a quick note, voice memo, image, or link."
        />
      </div>
    </AppShell>
  );
}
