-- Phase 2: user-managed regions/functions, tags, and application classification FKs.
-- Preserves existing application rows.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('region', 'function')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists categories_type_name_idx
  on public.categories (type, lower(name));

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tags_name_idx
  on public.tags (lower(name));

alter table public.applications
  add column if not exists region_id uuid references public.categories(id) on delete set null;

alter table public.applications
  add column if not exists function_id uuid references public.categories(id) on delete set null;

create table if not exists public.application_tags (
  application_id uuid not null references public.applications(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (application_id, tag_id)
);

create index if not exists applications_region_idx on public.applications (region_id);
create index if not exists applications_function_idx on public.applications (function_id);

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

alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.application_tags enable row level security;

drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories for all using (true) with check (true);

drop policy if exists tags_all on public.tags;
create policy tags_all on public.tags for all using (true) with check (true);

drop policy if exists application_tags_all on public.application_tags;
create policy application_tags_all on public.application_tags for all using (true) with check (true);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name = 'region'
  ) then
    insert into public.categories (name, type)
    select distinct trim(region), 'region'
    from public.applications
    where region is not null and trim(region) <> ''
      and not exists (
        select 1
        from public.categories c
        where c.type = 'region'
          and lower(c.name) = lower(trim(applications.region))
      );

    update public.applications a
    set region_id = c.id
    from public.categories c
    where a.region_id is null
      and a.region is not null
      and c.type = 'region'
      and lower(c.name) = lower(trim(a.region));
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'applications'
      and column_name = 'function_category'
  ) then
    insert into public.categories (name, type)
    select distinct trim(function_category), 'function'
    from public.applications
    where function_category is not null and trim(function_category) <> ''
      and not exists (
        select 1
        from public.categories c
        where c.type = 'function'
          and lower(c.name) = lower(trim(applications.function_category))
      );

    update public.applications a
    set function_id = c.id
    from public.categories c
    where a.function_id is null
      and a.function_category is not null
      and c.type = 'function'
      and lower(c.name) = lower(trim(a.function_category));
  end if;
end $$;

alter table public.applications drop column if exists region;
alter table public.applications drop column if exists function_category;
