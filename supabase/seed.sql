-- Atlas — local dev seed
-- Creates one workspace. Member rows need real auth.users ids, so they're
-- added after you sign in via the local Supabase studio (inbucket catches
-- magic links at http://localhost:54324).

-- insert into public.workspaces (id, name, owner_id) values
--   ('00000000-0000-0000-0000-000000000001', 'Atlas', '<your-auth-user-id>');
-- insert into public.workspace_members (workspace_id, user_id, role) values
--   ('00000000-0000-0000-0000-000000000001', '<your-auth-user-id>', 'owner');
