"use client";

import { Inbox, Plus } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState, PageHeading } from "@/components/shell/PageHeading";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { Kbd } from "@/components/primitives/Kbd";
import { InboxList } from "@/components/inbox/InboxList";
import { useMe } from "@/lib/queries/me";
import { useInbox } from "@/lib/queries/inbox";
import { useUI } from "@/lib/store/ui";

export default function InboxPage() {
  const me = useMe();
  const workspaceId = me.data?.workspaces[0]?.id;
  const inbox = useInbox(workspaceId);
  const setQuickCaptureOpen = useUI((s) => s.setQuickCaptureOpen);

  const isEmpty = !inbox.data || inbox.data.length === 0;

  return (
    <AppShell crumbs={["Atlas", "Inbox"]}>
      <div className="mx-auto max-w-[720px] px-7 pb-12 pt-7">
        <PageHeading
          eyebrow="Capture"
          title="Inbox"
          actions={
            <Button
              variant="primary"
              leadingIcon={<Icon icon={Plus} size={14} />}
              trailingIcon={<Kbd inverse>⌘N</Kbd>}
              onClick={() => setQuickCaptureOpen(true)}
            >
              New
            </Button>
          }
        />
        {inbox.isLoading || me.isLoading ? (
          <div className="text-sm text-fg-3">Loading…</div>
        ) : isEmpty ? (
          <EmptyState
            icon={<Icon icon={Inbox} size={28} />}
            title="No captures yet."
            hint="Press ⌘N anywhere to drop a quick note, voice memo, or link."
          />
        ) : (
          <InboxList workspaceId={workspaceId} />
        )}
      </div>
    </AppShell>
  );
}
