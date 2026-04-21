-- Atlas — 0400: pg_cron schedule (stub)
-- Supabase Free restricts ALTER DATABASE SET, so we configure the drain
-- schedule after the Vercel production URL is known via a post-deploy SQL
-- run (see scripts/setup-pg-cron.sql). This migration intentionally does
-- nothing on push.

select 1;
