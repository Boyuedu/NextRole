-- Optional referral code on each application.
-- Preserves existing applications; existing rows stay NULL.

alter table public.applications
  add column if not exists referral_code text;
