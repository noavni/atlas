/**
 * Thin typed fetch wrapper around the FastAPI backend at /api/*.
 * Attaches the Supabase session JWT when present so server-side RLS kicks in.
 */

import { supabaseBrowser } from "@/lib/supabase/client";

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

export interface ApiOptions extends RequestInit {
  idempotencyKey?: string;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const { data } = await supabaseBrowser().auth.getSession();
  return data.session?.access_token ?? null;
}

export async function apiFetch<T = JsonValue>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = await getAccessToken();
  const headers = new Headers(opts.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);
  if (opts.idempotencyKey) headers.set("idempotency-key", opts.idempotencyKey);

  const res = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    ...opts,
    headers,
  });

  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    throw new ApiError(res.status, body, `API ${res.status}: ${path}`);
  }
  return body as T;
}
