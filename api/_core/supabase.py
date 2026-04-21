"""Supabase client factory.

Two flavors:
  * user-scoped: authenticated via the caller's JWT so Postgres RLS is the
    backstop. Used by all `/api/v1/*` handlers.
  * service-role: bypasses RLS. Used only by the worker drain and internal
    jobs (pgmq, embedding writes). Never reached by user code paths.
"""

from __future__ import annotations

from supabase import Client, create_client

from .settings import get_settings


def user_client(jwt: str) -> Client:
    s = get_settings()
    client = create_client(s.supabase_url, s.supabase_anon_key)
    client.postgrest.auth(jwt)
    return client


def service_client() -> Client:
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_role_key)
