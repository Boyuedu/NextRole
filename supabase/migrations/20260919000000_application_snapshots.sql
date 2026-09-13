-- Application Snapshot: one saved JD, referral code, and resume per application.
-- Resume binaries live in the application-resumes storage bucket, not this table.

create table if not exists public.application_snapshots (
  id uuid primary key default gen_random_uuid(),
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

drop trigger if exists application_snapshots_set_updated_at on public.application_snapshots;
create trigger application_snapshots_set_updated_at
before update on public.application_snapshots
for each row
execute function public.set_updated_at();

alter table public.application_snapshots enable row level security;

drop policy if exists application_snapshots_all on public.application_snapshots;
create policy application_snapshots_all on public.application_snapshots for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('application-resumes', 'application-resumes', false)
on conflict (id) do nothing;

drop policy if exists application_resumes_all on storage.objects;
create policy application_resumes_all
on storage.objects
for all
using (bucket_id = 'application-resumes')
with check (bucket_id = 'application-resumes');
