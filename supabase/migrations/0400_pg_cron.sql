-- Atlas — 0400: pg_cron schedule
-- Fires /api/internal/worker/drain every minute. The shared secret header
-- is stored in a database setting and read at schedule time.
--
-- Before running this migration, set the two settings below on the Supabase
-- project (Settings → Database → Custom configuration parameters, or via
-- `alter database postgres set ...` as a superuser):
--
--   atlas.worker_url     = 'https://<your-vercel-url>/api/internal/worker/drain'
--   atlas.worker_secret  = '<matches WORKER_SHARED_SECRET env var>'
--
-- The job survives restarts. Unschedule with:
--   select extensions.cron.unschedule('atlas-drain-worker');

select extensions.cron.schedule(
  'atlas-drain-worker',
  '* * * * *',
  $$
  select extensions.net.http_post(
    url := current_setting('atlas.worker_url'),
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-worker-secret', current_setting('atlas.worker_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);
