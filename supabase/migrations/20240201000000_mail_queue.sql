create table if not exists public.mail_queue (
  id uuid default gen_random_uuid() primary key,
  recipient_email text not null,
  recipient_name text,
  subject text not null,
  body_html text, -- Can be null if using a template within the worker
  status text default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts int default 0,
  last_attempted_at timestamp with time zone,
  scheduled_for timestamp with time zone default now(),
  error_message text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Index for fetching pending emails quickly
create index if not exists idx_mail_queue_status_scheduled on public.mail_queue(status, scheduled_for);

-- RLS Policies
alter table public.mail_queue enable row level security;

create policy "Enable insert for authenticated and anon users"
on public.mail_queue for insert
to authenticated, anon
with check (true);

create policy "Enable select for authenticated users only"
on public.mail_queue for select
to authenticated
using (true);

create policy "Enable update for service_role only"
on public.mail_queue for update
to service_role
using (true)
with check (true);
