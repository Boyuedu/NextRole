-- Phase 4: extra indexes for common list and join queries.

create index if not exists applications_stage_idx
  on public.applications (stage);

create index if not exists application_tags_application_idx
  on public.application_tags (application_id);

create index if not exists application_tags_tag_idx
  on public.application_tags (tag_id);
