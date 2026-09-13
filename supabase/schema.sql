-- NextRole schema.
-- Run in the Supabase SQL editor for a new project, or apply migrations in order.
-- Create the owner Auth user before inserting seed data.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_row_user_id()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('region', 'function')),
  is_system boolean not null default false,
  translation_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_user_type_name_idx
  on public.categories (user_id, type, lower(name));
create index if not exists categories_user_id_idx on public.categories (user_id);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tags_user_name_idx
  on public.tags (user_id, lower(name));
create index if not exists tags_user_id_idx on public.tags (user_id);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_user_name_idx
  on public.companies (user_id, lower(name));
create index if not exists companies_user_id_idx on public.companies (user_id);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  company_id uuid references public.companies(id) on delete set null,
  position text not null,
  location text,
  region_id uuid references public.categories(id) on delete set null,
  function_id uuid references public.categories(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'ended')),
  stage text not null default 'Saved',
  job_type text,
  applied_date date,
  job_url text,
  job_id text,
  resume_used text,
  source text,
  referral_code text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.application_tags (
  application_id uuid not null references public.applications(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (application_id, tag_id)
);

create index if not exists application_tags_application_idx
  on public.application_tags (application_id);
create index if not exists application_tags_tag_idx
  on public.application_tags (tag_id);
create index if not exists application_tags_user_id_idx
  on public.application_tags (user_id);

create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_archived_idx on public.applications (archived);
create index if not exists applications_region_idx on public.applications (region_id);
create index if not exists applications_function_idx on public.applications (function_id);
create index if not exists applications_company_idx on public.applications (company_id);
create index if not exists applications_stage_idx on public.applications (stage);
create index if not exists applications_user_id_idx on public.applications (user_id);

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row
execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists tags_set_updated_at on public.tags;
create trigger tags_set_updated_at
before update on public.tags
for each row
execute function public.set_updated_at();

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

drop trigger if exists categories_set_user_id on public.categories;
create trigger categories_set_user_id
before insert on public.categories
for each row execute function public.set_row_user_id();

drop trigger if exists tags_set_user_id on public.tags;
create trigger tags_set_user_id
before insert on public.tags
for each row execute function public.set_row_user_id();

drop trigger if exists companies_set_user_id on public.companies;
create trigger companies_set_user_id
before insert on public.companies
for each row execute function public.set_row_user_id();

drop trigger if exists applications_set_user_id on public.applications;
create trigger applications_set_user_id
before insert on public.applications
for each row execute function public.set_row_user_id();

drop trigger if exists application_tags_set_user_id on public.application_tags;
create trigger application_tags_set_user_id
before insert on public.application_tags
for each row execute function public.set_row_user_id();

alter table public.applications enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.companies enable row level security;
alter table public.application_tags enable row level security;

create table if not exists public.application_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
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
create index if not exists application_events_user_id_idx
  on public.application_events (user_id);

drop trigger if exists application_events_set_updated_at on public.application_events;
create trigger application_events_set_updated_at
before update on public.application_events
for each row
execute function public.set_updated_at();

drop trigger if exists application_events_set_user_id on public.application_events;
create trigger application_events_set_user_id
before insert on public.application_events
for each row execute function public.set_row_user_id();

alter table public.application_events enable row level security;

create table if not exists public.application_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_id uuid not null unique references public.applications(id) on delete cascade,
  job_description text,
  referral_code text,
  resume_file_name text,
  resume_storage_path text,
  resume_mime_type text,
  resume_file_size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists application_snapshots_user_id_idx
  on public.application_snapshots (user_id);

drop trigger if exists application_snapshots_set_updated_at on public.application_snapshots;
create trigger application_snapshots_set_updated_at
before update on public.application_snapshots
for each row
execute function public.set_updated_at();

drop trigger if exists application_snapshots_set_user_id on public.application_snapshots;
create trigger application_snapshots_set_user_id
before insert on public.application_snapshots
for each row execute function public.set_row_user_id();

alter table public.application_snapshots enable row level security;

do $$
declare
  table_name text;
  command text;
begin
  foreach table_name in array array[
    'categories',
    'tags',
    'companies',
    'applications',
    'application_tags',
    'application_events',
    'application_snapshots'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_all', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_delete', table_name);

    command := format(
      'create policy %I on public.%I for select to authenticated using (user_id = auth.uid())',
      table_name || '_select',
      table_name
    );
    execute command;

    command := format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())',
      table_name || '_insert',
      table_name
    );
    execute command;

    command := format(
      'create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name || '_update',
      table_name
    );
    execute command;

    command := format(
      'create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())',
      table_name || '_delete',
      table_name
    );
    execute command;
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('application-resumes', 'application-resumes', false)
on conflict (id) do update set public = false;

drop policy if exists application_resumes_all on storage.objects;
drop policy if exists application_resumes_select on storage.objects;
drop policy if exists application_resumes_insert on storage.objects;
drop policy if exists application_resumes_update on storage.objects;
drop policy if exists application_resumes_delete on storage.objects;

create policy application_resumes_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'application-resumes'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy application_resumes_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'application-resumes'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy application_resumes_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'application-resumes'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'application-resumes'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy application_resumes_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'application-resumes'
  and split_part(name, '/', 1) = auth.uid()::text
);
