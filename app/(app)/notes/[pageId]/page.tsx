"use client";

import { use } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeading } from "@/components/shell/PageHeading";

interface Params {
  params: Promise<{ pageId: string }>;
}

export default function NotePage({ params }: Params) {
  const { pageId } = use(params);
  const title = decodeURIComponent(pageId);
  return (
    <AppShell crumbs={["Atlas", "Notes", title]}>
      <article className="mx-auto max-w-reading px-7 pb-12 pt-7">
        <PageHeading title={title} />
        <p className="font-serif text-[18px] leading-[1.6] text-fg-2">
          The note editor arrives in Phase 2.
        </p>
      </article>
    </AppShell>
  );
}
