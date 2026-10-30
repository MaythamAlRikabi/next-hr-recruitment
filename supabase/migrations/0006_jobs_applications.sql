-- NEXT | HR & Recruitment — Migration 0006: jobs, saved jobs, applications, hiring pipeline.
-- STATUS: DRAFT. Tested on a scratch PostgreSQL only (supabase/tests/rls_jobs.sql).
--         NOT applied to the production Supabase project — requires release approval.
-- No seed/demo rows are inserted: the platform must show real vacancies only.
--
-- Security model
--   * Public (anon) sees only: published, not-expired jobs of APPROVED companies.
--   * Company members see/manage their own company's jobs and applicants only.
--   * Employers can never publish: draft -> pending_review is theirs, published is NEXT staff only.
--   * Candidates see/withdraw only their own applications. Employer notes are never visible to them.
--   * Applicant profile data is readable by the hiring company ONLY for people who applied to it.

-- ---------------------------------------------------------------- enums
create type public.job_status as enum ('draft', 'pending_review', 'published', 'closed', 'archived');
create type public.employment_type as enum ('full_time', 'part_time', 'contract', 'internship', 'temporary');
create type public.work_mode as enum ('on_site', 'hybrid', 'remote');
create type public.application_status as enum
  ('new', 'review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected', 'withdrawn');

-- ---------------------------------------------------------------- jobs
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 140),
  description text not null check (char_length(description) between 30 and 10000),
  requirements text check (requirements is null or char_length(requirements) <= 6000),
  industry text check (industry is null or industry ~ '^[a-z0-9-]{2,40}$'),
  city text check (city is null or char_length(city) <= 80),
  country text not null default 'IQ' check (country ~ '^[A-Z]{2}$'),
  employment_type public.employment_type not null default 'full_time',
  work_mode public.work_mode not null default 'on_site',
  salary_min integer check (salary_min is null or salary_min >= 0),
  salary_max integer check (salary_max is null or salary_max >= 0),
  salary_currency text check (salary_currency is null or salary_currency in ('IQD', 'USD')),
  show_salary boolean not null default false,
  deadline date,
  status public.job_status not null default 'draft',
  published_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jobs_salary_range check (salary_min is null or salary_max is null or salary_max >= salary_min),
  constraint jobs_salary_currency check ((salary_min is null and salary_max is null) or salary_currency is not null)
);
create trigger jobs_updated before update on public.jobs
  for each row execute function public.set_updated_at();
create index jobs_company_idx on public.jobs(company_id);
create index jobs_created_by_idx on public.jobs(created_by);
create index jobs_public_idx on public.jobs(published_at desc) where status = 'published';
create index jobs_industry_idx on public.jobs(industry) where status = 'published';

-- Workflow guard: only NEXT staff can publish; identity columns are immutable for everyone else.
create or replace function public.guard_job_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status not in ('draft', 'pending_review') and not private.is_next_staff() then
      raise exception 'new jobs must start as draft or pending_review';
    end if;
  else
    if (new.company_id is distinct from old.company_id or new.created_by is distinct from old.created_by)
       and not private.is_next_admin() then
      raise exception 'company_id and created_by are immutable';
    end if;
    if new.status = 'published' and old.status is distinct from 'published' and not private.is_next_staff() then
      raise exception 'only NEXT staff can publish a job';
    end if;
    if old.status = 'published' and new.status in ('draft', 'pending_review') and not private.is_next_staff() then
      raise exception 'a published job can only be closed or archived by its company';
    end if;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger jobs_guard before insert or update on public.jobs
  for each row execute function public.guard_job_write();
revoke execute on function public.guard_job_write() from public, anon, authenticated;

-- ---------------------------------------------------------------- saved jobs
create table public.saved_jobs (
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);
create index saved_jobs_job_idx on public.saved_jobs(job_id);

-- ---------------------------------------------------------------- applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  cover_note text check (cover_note is null or char_length(cover_note) <= 3000),
  status public.application_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)
);
create trigger applications_updated before update on public.applications
  for each row execute function public.set_updated_at();
create index applications_candidate_idx on public.applications(candidate_id);
create index applications_job_status_idx on public.applications(job_id, status);

create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications(id) on delete cascade,
  from_status public.application_status,
  to_status public.application_status not null,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index application_events_app_idx on public.application_events(application_id);
create index application_events_actor_idx on public.application_events(actor_id);

-- Private, company-side notes. Candidates never see these.
create table public.application_notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index application_notes_app_idx on public.application_notes(application_id);
create index application_notes_author_idx on public.application_notes(author_id);

-- Status-transition rules + history (BEFORE UPDATE). SECURITY DEFINER so it can look at the job's company.
create or replace function public.guard_application_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _company uuid;
  _is_member boolean;
begin
  select company_id into _company from public.jobs where id = new.job_id;
  _is_member := private.company_role_of(_company) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager');

  if new.status is distinct from old.status then
    if _is_member or private.is_next_staff() then
      if new.status in ('new', 'withdrawn') then
        raise exception 'employers cannot set status %', new.status;
      end if;
      if old.status = 'withdrawn' then
        raise exception 'a withdrawn application cannot be changed';
      end if;
    elsif auth.uid() = old.candidate_id then
      if new.status <> 'withdrawn' or old.status in ('hired', 'rejected', 'withdrawn') then
        raise exception 'candidates can only withdraw an active application';
      end if;
    else
      raise exception 'not allowed to change application status';
    end if;
    insert into public.application_events (application_id, from_status, to_status, actor_id)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger applications_guard before update on public.applications
  for each row execute function public.guard_application_write();
revoke execute on function public.guard_application_write() from public, anon, authenticated;

-- History for the first row (status 'new') is written after insert.
create or replace function public.log_application_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.application_events (application_id, from_status, to_status, actor_id)
  values (new.id, null, new.status, new.candidate_id);
  return new;
end $$;
create trigger applications_created after insert on public.applications
  for each row execute function public.log_application_created();
revoke execute on function public.log_application_created() from public, anon, authenticated;

-- ---------------------------------------------------------------- privileges (least privilege)
revoke all on public.jobs, public.saved_jobs, public.applications,
              public.application_events, public.application_notes from anon, authenticated;
grant select on public.jobs to anon;
grant select, insert, update on public.jobs to authenticated;
grant select, insert, delete on public.saved_jobs to authenticated;
grant select, insert on public.applications to authenticated;
grant update (status) on public.applications to authenticated;     -- nothing else is editable after submit
grant select on public.application_events to authenticated;       -- written only by triggers
grant select, insert, delete on public.application_notes to authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.jobs enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.application_notes enable row level security;

-- jobs ---------------------------------------------------------------
create policy jobs_public_read on public.jobs
  for select to anon, authenticated
  using (
    status = 'published'
    and (deadline is null or deadline >= current_date)
    and exists (select 1 from public.companies c where c.id = jobs.company_id and c.verification = 'approved')
  );
create policy jobs_member_read on public.jobs
  for select to authenticated
  using (private.company_role_of(company_id) is not null or private.is_next_staff());
create policy jobs_member_insert on public.jobs
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (private.company_role_of(company_id) in ('owner', 'hr_manager', 'recruiter') or private.is_next_staff())
  );
create policy jobs_member_update on public.jobs
  for update to authenticated
  using (private.company_role_of(company_id) in ('owner', 'hr_manager', 'recruiter') or private.is_next_staff())
  with check (private.company_role_of(company_id) in ('owner', 'hr_manager', 'recruiter') or private.is_next_staff());

-- saved jobs ---------------------------------------------------------
create policy saved_own_select on public.saved_jobs
  for select to authenticated using (user_id = auth.uid());
create policy saved_own_insert on public.saved_jobs
  for insert to authenticated
  with check (user_id = auth.uid() and exists (select 1 from public.jobs j where j.id = job_id));
create policy saved_own_delete on public.saved_jobs
  for delete to authenticated using (user_id = auth.uid());

-- applications -------------------------------------------------------
create policy applications_candidate_read on public.applications
  for select to authenticated using (candidate_id = auth.uid());
create policy applications_company_read on public.applications
  for select to authenticated
  using (
    private.is_next_staff()
    or exists (select 1 from public.jobs j
               where j.id = applications.job_id
                 and private.company_role_of(j.company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager'))
  );
create policy applications_candidate_insert on public.applications
  for insert to authenticated
  with check (
    candidate_id = auth.uid()
    and status = 'new'
    and exists (select 1 from public.jobs j
                join public.companies c on c.id = j.company_id
                where j.id = job_id and j.status = 'published'
                  and (j.deadline is null or j.deadline >= current_date)
                  and c.verification = 'approved')
  );
create policy applications_status_update on public.applications
  for update to authenticated
  using (
    candidate_id = auth.uid()
    or private.is_next_staff()
    or exists (select 1 from public.jobs j
               where j.id = applications.job_id
                 and private.company_role_of(j.company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager'))
  )
  with check (true); -- the transition rules live in guard_application_write()

-- application history ------------------------------------------------
create policy events_read on public.application_events
  for select to authenticated
  using (exists (select 1 from public.applications a where a.id = application_id));

-- employer notes (never candidate-visible) ----------------------------
create policy notes_company_read on public.application_notes
  for select to authenticated
  using (
    private.is_next_staff()
    or exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id
               where a.id = application_id
                 and private.company_role_of(j.company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager'))
  );
create policy notes_company_insert on public.application_notes
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (private.is_next_staff()
         or exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id
                    where a.id = application_id
                      and private.company_role_of(j.company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager')))
  );
create policy notes_author_delete on public.application_notes
  for delete to authenticated using (author_id = auth.uid());

-- Hiring company may read the profile of people who applied to one of its jobs — nobody else's.
create policy profiles_select_applicants on public.profiles
  for select to authenticated
  using (
    exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id
            where a.candidate_id = profiles.id
              and private.company_role_of(j.company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager'))
  );
