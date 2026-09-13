-- Lightweight company entity. Applications stay independent; deleting a
-- company only unlinks it (company_id becomes null) and keeps the name.

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_name_idx
  on public.companies (lower(name));

alter table public.applications
  add column if not exists company_id uuid references public.companies(id) on delete set null;

create index if not exists applications_company_idx
  on public.applications (company_id);

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at
before update on public.companies
for each row
execute function public.set_updated_at();

alter table public.companies enable row level security;

drop policy if exists companies_all on public.companies;
create policy companies_all on public.companies for all using (true) with check (true);

insert into public.companies (name, created_at, updated_at)
select
  min(a.company) as name,
  min(a.created_at) as created_at,
  min(a.created_at) as updated_at
from public.applications a
where coalesce(trim(a.company), '') <> ''
  and not exists (
    select 1
    from public.companies c
    where lower(c.name) = lower(a.company)
  )
group by lower(a.company);

update public.applications a
set company_id = c.id
from public.companies c
where a.company_id is null
  and lower(a.company) = lower(c.name);
