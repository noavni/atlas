"use client";

import { Inbox, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { EmptyState } from "@/components/shell/PageHeading";
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

  const count = inbox.data?.length ?? 0;

  return (
    <AppShell crumbs={["Atlas", "Inbox"]}>
      <div className="mx-auto max-w-[720px] px-7 pb-12 pt-7">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-fg-3">
              today · inbox
            </div>
            <h1 className="m-0 font-display text-3xl font-semibold tracking-[-0.018em] text-fg-1">
              Brain dump
            </h1>
            <p className="mt-1.5 text-sm text-fg-3">
              {count === 0
                ? "Empty. Press ⌘N to drop something in."
                : `${count} ${count === 1 ? "thing" : "things"} to organize. No hurry.`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setQuickCaptureOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3 font-ui text-[12.5px] font-medium text-fg-1 shadow-1 transition-colors hover:bg-surface-2"
          >
            <Icon icon={Sparkles} size={14} />
            <span>Quick capture</span>
            <Kbd>⌘N</Kbd>
          </button>
        </div>
        {inbox.isLoading || me.isLoading ? (
          <div className="text-sm text-fg-3">Loading…</div>
        ) : count === 0 ? (
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
