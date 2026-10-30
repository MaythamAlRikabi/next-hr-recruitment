-- 0009 — External job listings (DRAFT: not applied anywhere; test on Staging first).
-- Depends on 0001–0007 (private.is_next_staff, public.set_updated_at).
--
-- Jobs that NEXT did not create: found on third-party sources (public Telegram channels, RSS feeds, career pages that publish
-- schema.org JobPosting data) or pasted in by a NEXT recruiter. They are never shown as NEXT vacancies and never go through NEXT's
-- application flow: every listing shows its source and the candidate applies on the original site.
--
-- Rules:
--   * only NEXT staff can read or write the raw rows; the public sees published, unexpired rows through a view
--     that omits the raw post text and internal fields;
--   * every row starts as 'pending_review'; a human publishes it;
--   * a post is stored once per source (unique source_id + external_ref / raw_hash) so re-fetching never duplicates;
--   * rows expire automatically (expires_at) so stale vacancies disappear.

create type public.job_source_kind as enum ('telegram_channel', 'rss_feed', 'career_page', 'manual');
create type public.external_job_status as enum ('pending_review', 'published', 'rejected', 'expired');

create table public.job_sources (
  id uuid primary key default gen_random_uuid(),
  kind public.job_source_kind not null,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  url text check (url is null or url ~* '^https://'),
  handle text check (handle is null or handle ~ '^[A-Za-z0-9_]{4,64}$'),
  -- why NEXT is allowed to use this source (owner permission, public feed, official API …): required for every non-manual source
  basis text check (basis is null or char_length(basis) <= 500),
  active boolean not null default true,
  last_run_at timestamptz,
  last_status text check (last_status is null or char_length(last_status) <= 300),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_sources_target check (kind = 'manual' or url is not null or handle is not null),
  constraint job_sources_basis_required check (kind = 'manual' or basis is not null)
);
create trigger job_sources_updated before update on public.job_sources
  for each row execute function public.set_updated_at();

create table public.external_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.job_sources(id) on delete set null,
  source_label text not null check (char_length(btrim(source_label)) between 2 and 120),
  external_ref text check (external_ref is null or char_length(external_ref) <= 300), -- e.g. "channel/1234"
  source_url text check (source_url is null or source_url ~* '^https?://'),
  raw_text text not null check (char_length(raw_text) between 20 and 20000),
  raw_hash text not null check (raw_hash ~ '^[0-9a-f]{64}$'),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  agency text check (agency is null or char_length(agency) <= 120),
  client_note text check (client_note is null or char_length(client_note) <= 400),
  city text check (city is null or city ~ '^[a-z-]{2,40}$'),
  industry text check (industry is null or industry ~ '^[a-z0-9-]{2,40}$'),
  employment_type public.employment_type not null default 'full_time',
  salary_min integer check (salary_min is null or salary_min >= 0),
  salary_max integer check (salary_max is null or salary_max >= 0),
  salary_currency text check (salary_currency is null or salary_currency in ('IQD', 'USD')),
  salary_note text check (salary_note is null or char_length(salary_note) <= 200),
  responsibilities text[] not null default '{}' check (cardinality(responsibilities) <= 30),
  requirements text[] not null default '{}' check (cardinality(requirements) <= 30),
  apply_url text check (apply_url is null or apply_url ~* '^https?://'),
  apply_email text check (apply_email is null or apply_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  language text not null default 'ar' check (language in ('ar', 'en')),
  parse_warnings text[] not null default '{}',
  status public.external_job_status not null default 'pending_review',
  posted_at timestamptz,
  fetched_at timestamptz not null default now(),
  published_at timestamptz,
  expires_at timestamptz not null default (now() + interval '45 days'),
  reviewed_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint external_jobs_salary_range check (salary_min is null or salary_max is null or salary_max >= salary_min),
  constraint external_jobs_salary_currency check ((salary_min is null and salary_max is null) or salary_currency is not null),
  constraint external_jobs_has_apply_route check (apply_url is not null or apply_email is not null or source_url is not null)
);
create trigger external_jobs_updated before update on public.external_jobs
  for each row execute function public.set_updated_at();
create unique index external_jobs_hash_uniq on public.external_jobs(raw_hash);
create unique index external_jobs_ref_uniq on public.external_jobs(source_id, external_ref) where external_ref is not null;
create index external_jobs_public_idx on public.external_jobs(published_at desc) where status = 'published';
create index external_jobs_review_idx on public.external_jobs(created_at desc) where status = 'pending_review';

-- Write guard.
--   * Signed-in users: NEXT staff only; the reviewer is always the signed-in staff member, never client-supplied.
--   * Server jobs (the scheduled importer, running with the service role, no end-user session): may only INSERT rows as
--     'pending_review' and may not change a row's status. Nothing imports straight to the public site.
create or replace function public.guard_external_job_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare system_job boolean := auth.uid() is null and current_user in ('service_role', 'postgres', 'supabase_admin');
begin
  if not system_job and not private.is_next_staff() then
    raise exception 'only NEXT staff can write external jobs';
  end if;
  if tg_op = 'INSERT' then
    if not system_job then new.created_by := auth.uid(); end if;
    if new.status <> 'pending_review' and not (new.status = 'rejected' and not system_job) then
      raise exception 'new external jobs start as pending_review';
    end if;
  elsif new.status is distinct from old.status then
    if system_job then raise exception 'only NEXT staff can change the review status'; end if;
    new.reviewed_by := auth.uid();
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger external_jobs_guard before insert or update on public.external_jobs
  for each row execute function public.guard_external_job_write();
revoke execute on function public.guard_external_job_write() from public, anon, authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.job_sources enable row level security;
alter table public.external_jobs enable row level security;

create policy job_sources_staff_all on public.job_sources
  for all to authenticated using (private.is_next_staff()) with check (private.is_next_staff());
create policy external_jobs_staff_all on public.external_jobs
  for all to authenticated using (private.is_next_staff()) with check (private.is_next_staff());
-- No anon/authenticated policy on the base tables: the public reads only the view below.

-- Public view: published + not expired; omits raw_text, hashes, reviewer and warnings. Owner-run on purpose (like job_listings).
create view public.external_job_listings with (security_invoker = false) as
select
  e.id, e.title, e.agency, e.client_note, e.city, e.industry, e.employment_type,
  e.salary_min, e.salary_max, e.salary_currency, e.salary_note,
  e.responsibilities, e.requirements, e.apply_url, e.apply_email, e.source_label, e.source_url,
  e.language, e.posted_at, e.published_at, e.expires_at
from public.external_jobs e
where e.status = 'published' and e.expires_at > now();
revoke all on public.external_job_listings from public, anon, authenticated;
grant select on public.external_job_listings to anon, authenticated;

grant select, insert, update, delete on public.job_sources, public.external_jobs to authenticated;
