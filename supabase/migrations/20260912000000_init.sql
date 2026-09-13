-- Phase 1 schema for NextRole.
-- Run in the Supabase SQL editor if you want PostgreSQL persistence.

create extension if not exists "pgcrypto";

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  position text not null,
  location text,
  region text,
  function_category text,
  status text not null default 'active' check (status in ('active', 'ended')),
  stage text not null default 'Saved',
  job_type text,
  applied_date date,
  job_url text,
  job_id text,
  resume_used text,
  source text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_archived_idx on public.applications (archived);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

alter table public.applications enable row level security;

drop policy if exists applications_all on public.applications;
create policy applications_all on public.applications for all using (true) with check (true);
