-- Single-owner auth + RLS.
-- Additive: does not drop tables, truncate data, or reset the database.
--
-- Prerequisite: create the owner account in Authentication > Users first.
-- Existing rows are assigned to the earliest auth.users row (created_at, then id).
-- If you already have more than one auth user and that is the wrong owner,
-- stop and change the owner_id select below before running.

do $$
begin
  if not exists (select 1 from auth.users) then
    raise exception
      'Create the owner account in Authentication > Users first, then run this migration. No data was deleted.';
  end if;
end $$;

alter table public.categories
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.tags
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.companies
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.applications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.application_tags
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.application_events
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.application_snapshots
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

do $$
declare
  owner_id uuid;
begin
  select id
    into owner_id
  from auth.users
  order by created_at asc, id asc
  limit 1;

  update public.categories set user_id = owner_id where user_id is null;
  update public.tags set user_id = owner_id where user_id is null;
  update public.companies set user_id = owner_id where user_id is null;
  update public.applications set user_id = owner_id where user_id is null;
  update public.application_events e
     set user_id = a.user_id
    from public.applications a
   where e.application_id = a.id
     and e.user_id is null;
  update public.application_snapshots s
     set user_id = a.user_id
    from public.applications a
   where s.application_id = a.id
     and s.user_id is null;
  update public.application_tags t
     set user_id = a.user_id
    from public.applications a
   where t.application_id = a.id
     and t.user_id is null;

  update public.application_snapshots
     set resume_storage_path = owner_id::text || '/' || resume_storage_path
   where resume_storage_path is not null
     and resume_storage_path not like owner_id::text || '/%';

  update storage.objects
     set name = owner_id::text || '/' || name
   where bucket_id = 'application-resumes'
     and name not like owner_id::text || '/%';
end $$;

alter table public.categories alter column user_id set not null;
alter table public.tags alter column user_id set not null;
alter table public.companies alter column user_id set not null;
alter table public.applications alter column user_id set not null;
alter table public.application_tags alter column user_id set not null;
alter table public.application_events alter column user_id set not null;
alter table public.application_snapshots alter column user_id set not null;

create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists tags_user_id_idx on public.tags (user_id);
create index if not exists companies_user_id_idx on public.companies (user_id);
create index if not exists applications_user_id_idx on public.applications (user_id);
create index if not exists application_tags_user_id_idx on public.application_tags (user_id);
create index if not exists application_events_user_id_idx on public.application_events (user_id);
create index if not exists application_snapshots_user_id_idx on public.application_snapshots (user_id);

drop index if exists public.categories_type_name_idx;
drop index if exists public.tags_name_idx;
drop index if exists public.companies_name_idx;

create unique index if not exists categories_user_type_name_idx
  on public.categories (user_id, type, lower(name));
create unique index if not exists tags_user_name_idx
  on public.tags (user_id, lower(name));
create unique index if not exists companies_user_name_idx
  on public.companies (user_id, lower(name));

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

drop trigger if exists application_events_set_user_id on public.application_events;
create trigger application_events_set_user_id
before insert on public.application_events
for each row execute function public.set_row_user_id();

drop trigger if exists application_snapshots_set_user_id on public.application_snapshots;
create trigger application_snapshots_set_user_id
before insert on public.application_snapshots
for each row execute function public.set_row_user_id();

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
    execute format('alter table public.%I enable row level security', table_name);
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

update storage.buckets
   set public = false
 where id = 'application-resumes';

insert into storage.buckets (id, name, public)
values ('application-resumes', 'application-resumes', false)
on conflict (id) do nothing;

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
