"use client";

import dynamic from "next/dynamic";

export const GraphCanvas = dynamic(
  () => import("./GraphCanvas").then((m) => m.GraphCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-[calc(100vh-220px)] animate-pulse rounded-md bg-surface-raised shadow-1" />
    ),
  },
);
