-- Optional demo data for a new project.
-- Do not run this on an existing production database.
-- Create the owner Auth user first. Rows are assigned to that user.

do $$
begin
  if not exists (select 1 from auth.users) then
    raise exception 'Create the owner Auth user before running seed.sql';
  end if;
end $$;

insert into public.categories (
  id, name, type, is_system, translation_key, created_at, updated_at, user_id
)
select
  v.id, v.name, v.type, v.is_system, v.translation_key, v.created_at, v.updated_at, u.id
from (
  values
    ('c2222222-2222-4222-8222-222222222101'::uuid, 'R&D', 'function', true, 'rd', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222003'::uuid, 'Algorithm', 'function', true, 'algorithm', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222002'::uuid, 'Product', 'function', true, 'product', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222006'::uuid, 'Marketing', 'function', true, 'marketing', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222102'::uuid, 'Sales', 'function', true, 'sales', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222103'::uuid, 'Operations', 'function', true, 'operations', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222104'::uuid, 'Design', 'function', true, 'design', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222004'::uuid, 'Research', 'function', true, 'research', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222105'::uuid, 'Business', 'function', true, 'business', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('c2222222-2222-4222-8222-222222222106'::uuid, 'Other', 'function', true, 'other', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz)
) as v(id, name, type, is_system, translation_key, created_at, updated_at)
cross join (
  select id from auth.users order by created_at asc, id asc limit 1
) u
on conflict (id) do nothing;

insert into public.companies (id, name, created_at, updated_at, user_id)
select v.id, v.name, v.created_at, v.updated_at, u.id
from (
  values
    ('b6666666-6666-4666-8666-666666666001'::uuid, 'MiniMax', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('b6666666-6666-4666-8666-666666666002'::uuid, 'NVIDIA', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('b6666666-6666-4666-8666-666666666003'::uuid, 'Apple', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz),
    ('b6666666-6666-4666-8666-666666666004'::uuid, 'Insta360', '2026-08-01T00:00:00Z'::timestamptz, '2026-08-01T00:00:00Z'::timestamptz)
) as v(id, name, created_at, updated_at)
cross join (
  select id from auth.users order by created_at asc, id asc limit 1
) u
on conflict (id) do nothing;

insert into public.applications (
  id, company, company_id, position, location, region_id, function_id, status, stage,
  job_type, applied_date, job_url, job_id, resume_used, source, notes, archived, created_at, updated_at, user_id
)
select
  v.id, v.company, v.company_id, v.position, v.location, v.region_id, v.function_id, v.status, v.stage,
  v.job_type, v.applied_date, v.job_url, v.job_id, v.resume_used, v.source, v.notes, v.archived, v.created_at, v.updated_at, u.id
from (
  values
    (
      'a4444444-4444-4444-8444-444444444441'::uuid,
      'MiniMax', 'b6666666-6666-4666-8666-666666666001'::uuid, 'AI Product Manager', 'Shanghai, China',
      null::uuid, 'c2222222-2222-4222-8222-222222222002'::uuid,
      'active', 'Interview 1', 'Full-time', '2026-09-05'::date,
      'https://www.minimaxi.com/careers', 'MM-PM-2048', 'PM Resume v3', 'Company site',
      'Strong fit for multimodal product work.', false, '2026-09-05T00:00:00Z'::timestamptz, '2026-09-20T00:00:00Z'::timestamptz
    ),
    (
      'a4444444-4444-4444-8444-444444444442'::uuid,
      'NVIDIA', 'b6666666-6666-4666-8666-666666666002'::uuid, 'Technical Marketing Engineer - Robotics', 'Shanghai, China',
      null::uuid, 'c2222222-2222-4222-8222-222222222006'::uuid,
      'active', 'Applied', 'Full-time', '2026-09-08'::date,
      'https://nvidia.com/careers', 'NV-TME-8821', 'Technical Marketing Resume', 'LinkedIn',
      'Robotics + developer ecosystem role.', false, '2026-09-08T00:00:00Z'::timestamptz, '2026-09-08T00:00:00Z'::timestamptz
    ),
    (
      'a4444444-4444-4444-8444-444444444443'::uuid,
      'Apple', 'b6666666-6666-4666-8666-666666666003'::uuid, 'Machine Learning Engineer', 'Cupertino, CA',
      null::uuid, 'c2222222-2222-4222-8222-222222222003'::uuid,
      'ended', 'Rejected', 'Full-time', '2026-08-20'::date,
      'https://jobs.apple.com', 'APPLE-ML-3102', 'ML Resume v2', 'Campus recruiting',
      'Rejected after hiring manager screen.', false, '2026-08-20T00:00:00Z'::timestamptz, '2026-09-01T00:00:00Z'::timestamptz
    ),
    (
      'a4444444-4444-4444-8444-444444444444'::uuid,
      'Insta360', 'b6666666-6666-4666-8666-666666666004'::uuid, 'AI Product Manager', 'Shenzhen, China',
      null::uuid, 'c2222222-2222-4222-8222-222222222002'::uuid,
      'active', 'Applied', 'Full-time', '2026-09-10'::date,
      'https://www.insta360.com/careers', 'I360-PM-117', 'PM Resume v3', 'Referral',
      'Referred by a former intern.', false, '2026-09-10T00:00:00Z'::timestamptz, '2026-09-10T00:00:00Z'::timestamptz
    )
) as v(
  id, company, company_id, position, location, region_id, function_id, status, stage,
  job_type, applied_date, job_url, job_id, resume_used, source, notes, archived, created_at, updated_at
)
cross join (
  select id from auth.users order by created_at asc, id asc limit 1
) u
on conflict (id) do nothing;

insert into public.application_events (
  id, application_id, event_type, title, event_date, event_time, notes,
  interviewer, interview_type, method, created_at, updated_at, user_id
)
select
  v.id, v.application_id, v.event_type, v.title, v.event_date, v.event_time, v.notes,
  v.interviewer, v.interview_type, v.method, v.created_at, v.updated_at, u.id
from (
  values
    (
      'e5555555-5555-4555-8555-555555555001'::uuid,
      'a4444444-4444-4444-8444-444444444441'::uuid,
      'Application Submitted', 'Application Submitted', '2026-09-05'::date, null::time,
      'Submitted through company website.',
      null, null, null, '2026-09-05T00:00:00Z'::timestamptz, '2026-09-05T00:00:00Z'::timestamptz
    ),
    (
      'e5555555-5555-4555-8555-555555555002'::uuid,
      'a4444444-4444-4444-8444-444444444441'::uuid,
      'Interview', 'Interview 1', '2026-09-20'::date, '14:00'::time,
      'Interviewer: Product Lead
Focus: product sense and AI fundamentals',
      'Product Lead', 'Product Interview', 'Onsite', '2026-09-15T00:00:00Z'::timestamptz, '2026-09-20T00:00:00Z'::timestamptz
    ),
    (
      'e5555555-5555-4555-8555-555555555003'::uuid,
      'a4444444-4444-4444-8444-444444444441'::uuid,
      'Interview', 'Interview 2', '2026-09-29'::date, '10:30'::time,
      'Scheduled next round.',
      null, 'Technical Interview', 'Zoom', '2026-09-21T00:00:00Z'::timestamptz, '2026-09-21T00:00:00Z'::timestamptz
    ),
    (
      'e5555555-5555-4555-8555-555555555004'::uuid,
      'a4444444-4444-4444-8444-444444444442'::uuid,
      'Application Submitted', 'Application Submitted', '2026-09-08'::date, null::time,
      'Applied through LinkedIn.',
      null, null, null, '2026-09-08T00:00:00Z'::timestamptz, '2026-09-08T00:00:00Z'::timestamptz
    ),
    (
      'e5555555-5555-4555-8555-555555555005'::uuid,
      'a4444444-4444-4444-8444-444444444443'::uuid,
      'Application Submitted', 'Application Submitted', '2026-08-20'::date, null::time,
      null, null, null, null, '2026-08-20T00:00:00Z'::timestamptz, '2026-08-20T00:00:00Z'::timestamptz
    ),
    (
      'e5555555-5555-4555-8555-555555555006'::uuid,
      'a4444444-4444-4444-8444-444444444443'::uuid,
      'Rejected', 'Rejected', '2026-09-01'::date, null::time,
      'Rejected after hiring manager screen.',
      null, null, null, '2026-09-01T00:00:00Z'::timestamptz, '2026-09-01T00:00:00Z'::timestamptz
    ),
    (
      'e5555555-5555-4555-8555-555555555007'::uuid,
      'a4444444-4444-4444-8444-444444444444'::uuid,
      'Application Submitted', 'Application Submitted', '2026-09-10'::date, null::time,
      'Referred by a former intern.',
      null, null, null, '2026-09-10T00:00:00Z'::timestamptz, '2026-09-10T00:00:00Z'::timestamptz
    )
) as v(
  id, application_id, event_type, title, event_date, event_time, notes,
  interviewer, interview_type, method, created_at, updated_at
)
cross join (
  select id from auth.users order by created_at asc, id asc limit 1
) u
on conflict (id) do nothing;
