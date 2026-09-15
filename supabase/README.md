# Supabase

NextRole uses one owner account. Create that Auth user before applying SQL.

## New database

1. Create the owner user in Authentication > Users.
2. Run `schema.sql`.
3. Optionally run `seed.sql` for demo applications.

Do not run `seed.sql` against a database that already has real data.

## Existing database

Run files in `migrations/` in filename order. Do not reset the database. Do not re-run `seed.sql`.

| File | Adds |
| --- | --- |
| `20260912000000_init.sql` | Applications |
| `20260913000000_phase2.sql` | Categories, tags |
| `20260914000000_phase3.sql` | Timeline events |
| `20260915000000_referral_code.sql` | `referral_code` |
| `20260916000000_phase4_indexes.sql` | Extra indexes |
| `20260917000000_classification_system.sql` | System vs custom categories |
| `20260918000000_companies.sql` | Companies, `company_id` |
| `20260919000000_application_snapshots.sql` | Snapshots and `application-resumes` bucket |
| `20260920000000_auth_rls.sql` | `user_id` ownership and private resume path policies |
| `20260921000000_application_status_not_started.sql` | `not_started` status and Saved/Preparing backfill |

`schema.sql` is the current full schema. Migrations are the additive history for databases that already exist.

The `application-resumes` bucket must stay **private**. Resume object paths are `{user_id}/{application_id}/{filename}`.
