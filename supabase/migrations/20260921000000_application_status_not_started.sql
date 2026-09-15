-- Allow the third application lifecycle status without resetting data.
-- Existing Saved / Preparing rows move from active → not_started.

do $$
declare
  rec record;
begin
  for rec in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'applications'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ~* 'status'
      and pg_get_constraintdef(con.oid) ~* 'active'
      and pg_get_constraintdef(con.oid) !~* 'not_started'
  loop
    execute format(
      'alter table public.applications drop constraint %I',
      rec.conname
    );
  end loop;
end $$;

alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check
  check (status in ('not_started', 'active', 'ended'));

alter table public.applications
  alter column status set default 'not_started';

update public.applications
set status = 'not_started'
where lower(btrim(stage)) in ('saved', 'preparing')
  and status is distinct from 'not_started';

update public.applications
set status = 'active'
where lower(btrim(stage)) in (
    'applied',
    'oa',
    'interview 1',
    'interview 2',
    'interview 3',
    'final interview',
    'offer'
  )
  and status is distinct from 'active';

update public.applications
set status = 'ended'
where lower(btrim(stage)) in (
    'rejected',
    'withdrawn',
    'position closed',
    'offer declined',
    'not interested'
  )
  and status is distinct from 'ended';
