# NextRole

Your applications, all in one place.

NextRole is a lightweight job application tracker designed to keep the entire application process organized without turning into a complex CRM.

It helps users track applications, recruitment stages, classifications, timelines, and the exact materials used when applying.

## Features

- Application tracking
- Active / Ended application states
- Recruitment stages
- Custom Regions
- Broad + custom Function categories
- Fully custom Tags
- Reusable company names, with optional Group by Company
- Search and multi-filtering
- Timeline events
- Notes
- Referral codes
- Application Snapshot
- Resume upload and storage
- Archive / Restore
- JSON backup / restore
- CSV export
- Email + password sign-in for a single owner account
- English / Simplified Chinese interface

Application Snapshot preserves:

- Job Description
- Referral Code
- the exact Resume used for the application

## Philosophy

NextRole is intentionally focused.

It is designed to be more structured than a notes app or document, while remaining significantly simpler than a CRM.

The core principles are:

- Clear
- Lightweight
- Structured
- Private
- Fast to update

## Classification

**Region:** Fully user-defined.

**Function:** Starts with broad categories such as R&D, Algorithm, Product, Marketing, Sales, Operations, Design, Research, Business, and Other. Users can add or delete categories.

**Tags:** Fully user-defined.

System-owned labels support English / Chinese localization. User-created content remains exactly as entered.

## Application Lifecycle

**Status:** Active / Ended

**Stage:** Saved, Preparing, Applied, OA, Interview, Final Interview, Offer, Rejected, Withdrawn, and related stages.

Terminal stages automatically map to Ended. Returning to an active stage restores Active status.

## Application Snapshot

Application Snapshot saves the original context of an application:

- Job Description
- Referral Code
- Resume file

This allows users to return months later and see exactly what they applied with, even if the original job posting is no longer available or the resume has since changed.

Resume files are stored separately from normal application data.

- Local development without Supabase: IndexedDB
- Supabase mode: private Supabase Storage bucket `application-resumes`

JSON backups contain snapshot text and resume metadata, but not the resume binary itself.

## Internationalization

NextRole supports:

- English
- 简体中文

The brand name is always **NextRole** in both languages.

System UI and system-defined values are translated. User-created content is never automatically translated.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, PostgreSQL, Storage)
- IndexedDB for local resume storage in development when Supabase is not configured

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` if you want to use Supabase locally. Leave both variables empty to keep using browser storage in development. On first local load without Supabase, demo data is seeded in the browser.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

In development, empty values use `localStorage` for records and IndexedDB for resume files, and login is skipped.

In production, both values are required. The app does not fall back to localStorage if Supabase is missing or unavailable.

Never commit `.env.local`.

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Authentication > Providers: enable Email. Disable public sign-ups if you only want the owner account created from the dashboard.
3. Authentication > Users: create the owner user (email + password). Confirm the email if confirmation is enabled.
4. For a **new** database: create the owner user first, run `supabase/schema.sql`, then optionally `supabase/seed.sql`.
5. For an **existing** database: create the owner user first if it does not exist, then run the SQL files in `supabase/migrations/` in filename order. See `supabase/README.md`. Do not reset the database. Do not re-run `seed.sql`.
6. Storage: confirm the `application-resumes` bucket exists and is **private**.
7. Put the project URL and publishable key in `.env.local` and in Vercel.

Existing applications, categories, tags, companies, timeline events, snapshots, referral codes, and resume metadata are preserved.

## Database Migrations

Apply only the migrations you have not already run. Existing databases should run files in filename order and should **not** be reset.

| File | What it adds |
| --- | --- |
| `20260912000000_init.sql` | Applications |
| `20260913000000_phase2.sql` | Categories, tags |
| `20260914000000_phase3.sql` | Timeline events |
| `20260915000000_referral_code.sql` | `referral_code` |
| `20260916000000_phase4_indexes.sql` | Extra indexes |
| `20260917000000_classification_system.sql` | System vs custom categories, broad functions |
| `20260918000000_companies.sql` | Lightweight companies, `company_id` |
| `20260919000000_application_snapshots.sql` | Application snapshots and `application-resumes` storage bucket |
| `20260920000000_auth_rls.sql` | `user_id` ownership, owner RLS, private resume path policies |

## Backup and Restore

In Settings:

- **Export JSON** — complete structured backup of applications, events, snapshot text, resume metadata, regions, functions, tags, companies, and locale. Filename: `nextrole-backup-YYYY-MM-DD.json`. Resume binaries are not included.
- **Export CSV** — flat, human-readable application list for spreadsheets. UTF-8 with BOM.
- **Import** — NextRole JSON backup format only. Choose **Merge with existing data** or **Replace existing data**. Replace asks for a second confirmation. Invalid files are rejected and current data is left unchanged.

## Production Build

```bash
npm run lint
npm run typecheck
npm run build
```

```bash
npm start
```

## Deployment

1. Push the repo and import it into Vercel.
2. Framework preset: Next.js.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for Production (and Preview if you use those deployments).
4. Deploy. Unauthenticated visitors are sent to `/login`.

Without those env vars, a production build shows a configuration error instead of using browser storage.

## Project Scope

NextRole intentionally does not include:

- AI career recommendations
- resume scoring
- job matching
- automatic applications
- job scraping
- social networking
- complex CRM functionality

This is intentional, not a limitation.

## Project Structure

```text
app/                 Routes, including /login
components/
  applications/      List, detail, forms, filters
  auth/              Login and account
  layout/            Shell, sidebar, language switcher
  settings/          Settings and backup
  snapshot/          Application Snapshot
  timeline/          Timeline events
  shared/            Confirm dialog
  ui/                shadcn primitives
hooks/               Auth, tracker, i18n, and hydration helpers
lib/
  auth/              Login path helpers
  data/              Local and Supabase repositories
  storage/           Resume files (IndexedDB / Supabase Storage)
  supabase/          Browser client, env detection, proxy session
locales/             English and Simplified Chinese
supabase/            Schema, seed, and migrations
types/               Shared domain types
```
