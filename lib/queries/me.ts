"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Workspace } from "@/lib/types";

export interface MeResponse {
  user_id: string;
  email: string | null;
  workspaces: Workspace[];
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/v1/me"),
  });
}
