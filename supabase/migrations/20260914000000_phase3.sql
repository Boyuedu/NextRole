-- Phase 3: application timeline events.
-- Preserves existing applications, categories, and tags.

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  event_type text not null default 'Other',
  title text not null,
  event_date date not null,
  event_time time,
  notes text,
  interviewer text,
  interview_type text,
  method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_events_application_idx
  on public.application_events (application_id, event_date);

drop trigger if exists application_events_set_updated_at on public.application_events;
create trigger application_events_set_updated_at
before update on public.application_events
for each row
execute function public.set_updated_at();

alter table public.application_events enable row level security;

drop policy if exists application_events_all on public.application_events;
create policy application_events_all on public.application_events for all using (true) with check (true);
