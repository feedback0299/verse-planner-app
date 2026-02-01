-- Ensure RLS is enabled
alter table public.mail_queue enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Enable insert for authenticated and anon users" on public.mail_queue;
drop policy if exists "Enable insert for authenticated users" on public.mail_queue;
drop policy if exists "Enable select for authenticated users only" on public.mail_queue;
drop policy if exists "Enable update for service_role only" on public.mail_queue;

-- Create robust policies

-- 1. INSERT: Allow any authenticated user (e.g. Admin) to queue emails
create policy "Enable insert for authenticated users"
on public.mail_queue for insert
to authenticated
with check (true);

-- 2. SELECT: Allow users to see the queue (debugging/admin)
create policy "Enable select for authenticated users"
on public.mail_queue for select
to authenticated
using (true);

-- 3. UPDATE: Helper for the service role (worker)
create policy "Enable update for service_role"
on public.mail_queue for update
to service_role, authenticated
using (true)
with check (true);

-- 4. DELETE: Allow cleaning up
create policy "Enable delete for authenticated users"
on public.mail_queue for delete
to authenticated
using (true);
