-- Classification V1 refinement: system vs user categories, broad functions.
-- Preserves existing applications, regions, used tags, and custom functions.

alter table public.categories
  add column if not exists is_system boolean not null default false;

alter table public.categories
  add column if not exists translation_key text;

create or replace function public._promote_system_function(
  p_id uuid,
  p_name text,
  p_key text,
  p_legacy text[]
) returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  select c.id into v_id
  from public.categories c
  where c.type = 'function'
    and (
      c.id = p_id
      or lower(c.name) = lower(p_name)
      or lower(c.name) = any (select lower(x) from unnest(p_legacy) as x)
    )
  order by
    (lower(c.name) = lower(p_name)) desc,
    (c.id = p_id) desc
  limit 1;

  if v_id is not null then
    update public.categories
    set
      name = p_name,
      is_system = true,
      translation_key = p_key,
      updated_at = now()
    where id = v_id;
  else
    insert into public.categories (
      id, name, type, is_system, translation_key, created_at, updated_at
    )
    values (p_id, p_name, 'function', true, p_key, now(), now())
    on conflict (id) do update
      set
        name = excluded.name,
        is_system = true,
        translation_key = excluded.translation_key,
        updated_at = now();
  end if;
end;
$$;

select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222101',
  'R&D',
  'rd',
  array['R&D', 'research & development', 'research and development']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222003',
  'Algorithm',
  'algorithm',
  array['Algorithm']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222002',
  'Product',
  'product',
  array['Product', 'Product Manager']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222006',
  'Marketing',
  'marketing',
  array['Marketing']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222102',
  'Sales',
  'sales',
  array['Sales']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222103',
  'Operations',
  'operations',
  array['Operations']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222104',
  'Design',
  'design',
  array['Design']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222004',
  'Research',
  'research',
  array['Research']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222105',
  'Business',
  'business',
  array['Business']
);
select public._promote_system_function(
  'c2222222-2222-4222-8222-222222222106',
  'Other',
  'other',
  array['Other']
);

drop function public._promote_system_function(uuid, text, text, text[]);

-- Unused original seed tags may be removed; tags assigned to applications are kept.
delete from public.tags t
where t.id in (
  't3333333-3333-4333-8333-333333333001',
  't3333333-3333-4333-8333-333333333002',
  't3333333-3333-4333-8333-333333333003',
  't3333333-3333-4333-8333-333333333004',
  't3333333-3333-4333-8333-333333333005'
)
and not exists (
  select 1
  from public.application_tags at
  where at.tag_id = t.id
);
