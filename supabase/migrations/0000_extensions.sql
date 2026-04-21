-- Atlas — 0000: extensions
-- Enable only what we actually rely on. pgmq/pg_cron/pg_net live in the
-- `extensions` schema on Supabase; keep calls qualified.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";
create extension if not exists "vector";
create extension if not exists "pgmq" with schema "extensions";
create extension if not exists "pg_cron" with schema "extensions";
create extension if not exists "pg_net" with schema "extensions";
