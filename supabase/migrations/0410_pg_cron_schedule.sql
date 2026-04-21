-- Atlas — 0410: pg_cron schedule (values inlined post-deploy)
-- Must be applied after the Vercel production URL is known. Run via
-- `supabase db push` once the values below reflect live prod.

-- Unschedule previous if exists, so reruns are safe
do $$
begin
  perform cron.unschedule('atlas-drain-worker');
exception when others then null;
end $$;

select cron.schedule(
  'atlas-drain-worker',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://atlas-blush-nine.vercel.app/api/internal/worker/drain',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-worker-secret', '9d0da1e5f03fc63ba21f7abc0c4790d548a480e3000b6d6dff137e4678ec86ee'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);
