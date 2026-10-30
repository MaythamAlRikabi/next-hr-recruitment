-- NEXT | HR & Recruitment — Migration 0007: talent pool + consent, NEXT-managed recruitment, interviews,
-- job alerts, content CMS, confidential/managed job methods.
-- STATUS: DRAFT. Depends on 0006. Tested on a scratch PostgreSQL only (supabase/tests/rls_agency.sql).
--         NOT applied to the production Supabase project — requires release approval, after 0006.
-- Not included (needs a real Supabase project to test): Storage bucket + storage.objects policies for CV files.
-- No seed rows.
--
-- Security model
--   * A candidate is in the talent pool only after an explicit, revocable consent (append-only history).
--     Companies NEVER read candidate_profiles / resumes directly. They see candidates only through
--     client_shortlist_view, after NEXT staff submitted a shortlist AND the candidate's consent allows it.
--   * Jobs have a recruitment method. NEXT-managed and confidential jobs send applications to NEXT staff,
--     not to the client company. Confidential-executive jobs are never public; hidden-employer jobs are
--     public only through job_listings, which omits the employer.
--   * Request/shortlist state transitions are enforced by triggers; every sensitive transition is audited.

-- ---------------------------------------------------------------- enums
create type public.recruitment_method as enum ('direct', 'next_managed', 'confidential_executive');
create type public.resume_visibility as enum ('private', 'anonymized', 'searchable');
create type public.request_status as enum
  ('submitted', 'under_review', 'assigned', 'in_progress', 'shortlist_sent', 'placed', 'closed', 'declined');
create type public.shortlist_status as enum ('draft', 'submitted');
create type public.disclosure_level as enum ('anonymized', 'full');
create type public.item_consent as enum ('pending', 'granted', 'declined', 'revoked');
create type public.interview_mode as enum ('onsite', 'video', 'phone');
create type public.interview_status as enum ('scheduled', 'completed', 'cancelled', 'no_show');
create type public.article_status as enum ('draft', 'in_review', 'published', 'archived');
create type public.alert_frequency as enum ('daily', 'weekly');

-- ---------------------------------------------------------------- audit helper
create or replace function private.audit(_action text, _entity text, _id text, _details jsonb default '{}')
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), _action, _entity, _id, coalesce(_details, '{}'::jsonb));
$$;
revoke execute on function private.audit(text, text, text, jsonb) from public, anon;
grant execute on function private.audit(text, text, text, jsonb) to authenticated;

-- ---------------------------------------------------------------- jobs: recruitment method, confidentiality
alter table public.jobs
  add column recruitment_method public.recruitment_method not null default 'direct',
  add column hide_employer boolean not null default false,
  add column seniority text check (seniority is null or seniority in ('entry', 'mid', 'senior', 'manager', 'director', 'executive'));
alter table public.jobs add constraint jobs_exec_hidden
  check (recruitment_method <> 'confidential_executive' or hide_employer);

-- Only NEXT staff may use managed/confidential methods or hide the employer (extends the 0006 guard).
create or replace function public.guard_job_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.recruitment_method <> 'direct' or new.hide_employer) and not private.is_next_staff() then
    raise exception 'only NEXT staff can use managed or confidential recruitment';
  end if;
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

-- Direct table reads never expose hidden-employer or executive jobs to the public.
drop policy jobs_public_read on public.jobs;
create policy jobs_public_read on public.jobs
  for select to anon, authenticated
  using (
    status = 'published'
    and recruitment_method <> 'confidential_executive'
    and not hide_employer
    and (deadline is null or deadline >= current_date)
    and exists (select 1 from public.companies c where c.id = jobs.company_id and c.verification = 'approved')
  );

-- Public listing view: hides the employer when requested. Owner-run on purpose (security_invoker off).
create view public.job_listings with (security_invoker = false) as
select
  j.id, j.title, j.description, j.requirements, j.industry, j.city, j.country,
  j.employment_type, j.work_mode, j.seniority, j.recruitment_method, j.deadline, j.published_at,
  case when j.show_salary then j.salary_min end as salary_min,
  case when j.show_salary then j.salary_max end as salary_max,
  case when j.show_salary then j.salary_currency end as salary_currency,
  case when j.hide_employer then null else j.company_id end as company_id,
  case when j.hide_employer then null else c.name end as company_name,
  j.hide_employer as employer_hidden
from public.jobs j
join public.companies c on c.id = j.company_id
where j.status = 'published'
  and j.recruitment_method <> 'confidential_executive'
  and (j.deadline is null or j.deadline >= current_date)
  and c.verification = 'approved';
revoke all on public.job_listings from public, anon, authenticated;
grant select on public.job_listings to anon, authenticated;

-- ---------------------------------------------------------------- helper functions
create or replace function private.can_manage_direct_job(_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jobs j
    where j.id = _job and j.recruitment_method = 'direct'
      and private.company_role_of(j.company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager')
  );
$$;


-- ---------------------------------------------------------------- talent pool
create table public.talent_pool_consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('granted', 'withdrawn')),
  text_version text not null check (char_length(text_version) between 1 and 40),
  created_at timestamptz not null default now()
);
create index talent_pool_consents_user_idx on public.talent_pool_consents(user_id, id desc);

create or replace function private.has_active_pool_consent(_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((
    select c.action = 'granted' from public.talent_pool_consents c
    where c.user_id = _user order by c.id desc limit 1
  ), false);
$$;

create table public.candidate_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  headline text check (headline is null or char_length(headline) <= 140),
  summary text check (summary is null or char_length(summary) <= 3000),
  years_experience smallint check (years_experience is null or years_experience between 0 and 60),
  seniority text check (seniority is null or seniority in ('entry', 'mid', 'senior', 'manager', 'director', 'executive')),
  preferred_functions text[] not null default '{}' check (cardinality(preferred_functions) <= 10),
  preferred_locations text[] not null default '{}' check (cardinality(preferred_locations) <= 10),
  job_preferences jsonb not null default '{}'::jsonb check (pg_column_size(job_preferences) <= 4000),
  resume_visibility public.resume_visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger candidate_profiles_updated before update on public.candidate_profiles
  for each row execute function public.set_updated_at();

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique check (storage_path like user_id::text || '/%'),
  file_name text not null check (char_length(file_name) between 1 and 200),
  mime_type text not null check (mime_type in (
    'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index resumes_user_idx on public.resumes(user_id);
create unique index resumes_one_primary on public.resumes(user_id) where is_primary;

-- Visibility other than 'private' requires an active consent; withdrawing consent resets visibility.
create or replace function public.guard_candidate_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.resume_visibility <> 'private' and not private.has_active_pool_consent(new.user_id) then
    raise exception 'talent pool consent is required before changing visibility';
  end if;
  return new;
end $$;
create trigger candidate_profiles_guard before insert or update on public.candidate_profiles
  for each row execute function public.guard_candidate_profile();
revoke execute on function public.guard_candidate_profile() from public, anon, authenticated;

create or replace function public.on_pool_consent()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.action = 'withdrawn' then
    update public.candidate_profiles set resume_visibility = 'private' where user_id = new.user_id;
  end if;
  perform private.audit('talent_pool_' || new.action, 'talent_pool_consent', new.user_id::text,
                        jsonb_build_object('text_version', new.text_version));
  return new;
end $$;
create trigger talent_pool_consents_after after insert on public.talent_pool_consents
  for each row execute function public.on_pool_consent();
revoke execute on function public.on_pool_consent() from public, anon, authenticated;

-- ---------------------------------------------------------------- recruitment requests (NEXT-managed)
create table public.recruitment_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  requester_id uuid not null references auth.users(id),
  industry text check (industry is null or industry ~ '^[a-z0-9-]{2,40}$'),
  vacancies_count smallint not null default 1 check (vacancies_count between 1 and 200),
  positions text not null check (char_length(btrim(positions)) between 2 and 2000),
  experience_level text check (experience_level is null or experience_level in ('entry', 'mid', 'senior', 'manager', 'director', 'executive')),
  skills text check (skills is null or char_length(skills) <= 2000),
  locations text check (locations is null or char_length(locations) <= 500),
  deadline date,
  additional text check (additional is null or char_length(additional) <= 4000),
  confidential boolean not null default false,
  status public.request_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger recruitment_requests_updated before update on public.recruitment_requests
  for each row execute function public.set_updated_at();
create index recruitment_requests_company_idx on public.recruitment_requests(company_id);
create index recruitment_requests_requester_idx on public.recruitment_requests(requester_id);
create index recruitment_requests_status_idx on public.recruitment_requests(status);

create table public.agency_assignments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.recruitment_requests(id) on delete cascade,
  recruiter_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (request_id, recruiter_id)
);
create index agency_assignments_recruiter_idx on public.agency_assignments(recruiter_id);
create index agency_assignments_assigned_by_idx on public.agency_assignments(assigned_by);

create or replace function private.is_request_staff(_request uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_next_admin()
      or exists (select 1 from public.agency_assignments a where a.request_id = _request and a.recruiter_id = auth.uid())
      or (private.is_next_staff()
          and exists (select 1 from public.recruitment_requests r
                      where r.id = _request and r.status in ('submitted', 'under_review')));
$$;

create or replace function public.guard_request_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare _member boolean; _staff boolean; _ok boolean;
begin
  if tg_op = 'INSERT' then
    _member := private.company_role_of(new.company_id) in ('owner', 'hr_manager');
    if not _member and not private.is_next_staff() then
      raise exception 'only company owners/HR managers can request recruitment';
    end if;
    if new.status <> 'submitted' then raise exception 'new requests start as submitted'; end if;
    if new.requester_id is distinct from auth.uid() then raise exception 'requester must be the caller'; end if;
    perform private.audit('request_submitted', 'recruitment_request', new.id::text, '{}');
    return new;
  end if;
  if new.status is distinct from old.status then
    _staff := private.is_request_staff(old.id);
    _member := private.company_role_of(old.company_id) in ('owner', 'hr_manager');
    _ok := case old.status
      when 'submitted'      then new.status in ('under_review', 'declined', 'closed')
      when 'under_review'   then new.status in ('assigned', 'declined', 'closed')
      when 'assigned'       then new.status in ('in_progress', 'closed')
      when 'in_progress'    then new.status in ('shortlist_sent', 'closed')
      when 'shortlist_sent' then new.status in ('in_progress', 'placed', 'closed')
      else false end;
    if not _ok then raise exception 'invalid request transition % -> %', old.status, new.status; end if;
    if new.status = 'closed' and old.status in ('submitted', 'under_review') and _member and not _staff then
      null; -- a company may withdraw its own request before assignment
    elsif not _staff then
      raise exception 'only the assigned NEXT recruiter can change this request';
    end if;
    perform private.audit('request_' || new.status::text, 'recruitment_request', old.id::text,
                          jsonb_build_object('from', old.status));
  end if;
  return new;
end $$;
create trigger recruitment_requests_guard before insert or update on public.recruitment_requests
  for each row execute function public.guard_request_write();
revoke execute on function public.guard_request_write() from public, anon, authenticated;

create or replace function public.guard_assignment()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles ur
                 where ur.user_id = new.recruiter_id and ur.role in ('next_recruiter', 'next_admin', 'super_admin')) then
    raise exception 'assignee must be NEXT staff';
  end if;
  if new.assigned_by is distinct from auth.uid() then raise exception 'assigned_by must be the caller'; end if;
  perform private.audit('request_assigned', 'recruitment_request', new.request_id::text,
                        jsonb_build_object('recruiter_id', new.recruiter_id));
  update public.recruitment_requests set status = 'under_review' where id = new.request_id and status = 'submitted';
  update public.recruitment_requests set status = 'assigned' where id = new.request_id and status = 'under_review';
  return new;
end $$;
create trigger agency_assignments_guard before insert on public.agency_assignments
  for each row execute function public.guard_assignment();
revoke execute on function public.guard_assignment() from public, anon, authenticated;

-- ---------------------------------------------------------------- shortlists
create table public.shortlists (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.recruitment_requests(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 140),
  status public.shortlist_status not null default 'draft',
  submitted_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint shortlists_target check (request_id is not null or job_id is not null)
);
create index shortlists_request_idx on public.shortlists(request_id);
create index shortlists_job_idx on public.shortlists(job_id);
create index shortlists_created_by_idx on public.shortlists(created_by);

create table public.shortlist_items (
  id uuid primary key default gen_random_uuid(),
  shortlist_id uuid not null references public.shortlists(id) on delete cascade,
  candidate_id uuid not null references auth.users(id) on delete cascade,
  disclosure public.disclosure_level not null default 'anonymized',
  consent_status public.item_consent not null default 'pending',
  recruiter_note text check (recruiter_note is null or char_length(recruiter_note) <= 2000),
  created_at timestamptz not null default now(),
  unique (shortlist_id, candidate_id)
);
create index shortlist_items_candidate_idx on public.shortlist_items(candidate_id);

create or replace function private.can_staff_shortlist(_shortlist uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_next_admin() or exists (
    select 1 from public.shortlists s
    where s.id = _shortlist and private.is_next_staff()
      and (s.created_by = auth.uid() or (s.request_id is not null and private.is_request_staff(s.request_id)))
  );
$$;

create or replace function private.company_of_shortlist(_shortlist uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select coalesce(
    (select r.company_id from public.shortlists s join public.recruitment_requests r on r.id = s.request_id where s.id = _shortlist),
    (select j.company_id from public.shortlists s join public.jobs j on j.id = s.job_id where s.id = _shortlist));
$$;

create or replace function public.guard_shortlist()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if not private.is_next_staff() then raise exception 'only NEXT staff create shortlists'; end if;
    if new.status <> 'draft' then raise exception 'shortlists start as draft'; end if;
    if new.created_by is distinct from auth.uid() then raise exception 'created_by must be the caller'; end if;
    if new.request_id is not null and not private.is_request_staff(new.request_id) then
      raise exception 'not assigned to this request';
    end if;
    return new;
  end if;
  if old.status = 'submitted' then raise exception 'a submitted shortlist is immutable'; end if;
  if new.request_id is distinct from old.request_id or new.job_id is distinct from old.job_id
     or new.created_by is distinct from old.created_by then
    raise exception 'shortlist target and owner are immutable';
  end if;
  if new.status = 'submitted' then
    if not private.can_staff_shortlist(old.id) then raise exception 'not allowed to submit this shortlist'; end if;
    if exists (select 1 from public.shortlist_items i where i.shortlist_id = old.id
               and i.disclosure = 'full' and i.consent_status <> 'granted') then
      raise exception 'full disclosure requires the candidate''s consent';
    end if;
    if not exists (select 1 from public.shortlist_items i where i.shortlist_id = old.id) then
      raise exception 'cannot submit an empty shortlist';
    end if;
    new.submitted_at := now();
    perform private.audit('shortlist_submitted', 'shortlist', old.id::text, '{}');
    if old.request_id is not null then
      update public.recruitment_requests set status = 'shortlist_sent'
        where id = old.request_id and status = 'in_progress';
    end if;
  end if;
  return new;
end $$;
create trigger shortlists_guard before insert or update on public.shortlists
  for each row execute function public.guard_shortlist();
revoke execute on function public.guard_shortlist() from public, anon, authenticated;

create or replace function public.guard_shortlist_item()
returns trigger language plpgsql security definer set search_path = public as $$
declare _sl uuid := coalesce(new.shortlist_id, old.shortlist_id);
begin
  if tg_op = 'UPDATE' and auth.uid() = old.candidate_id and not private.is_next_staff() then
    -- the candidate controls only their own consent decision
    if new.shortlist_id is distinct from old.shortlist_id or new.candidate_id is distinct from old.candidate_id
       or new.disclosure is distinct from old.disclosure or new.recruiter_note is distinct from old.recruiter_note then
      raise exception 'candidates can only change their consent';
    end if;
    if not ((old.consent_status = 'pending' and new.consent_status in ('granted', 'declined'))
         or (old.consent_status = 'granted' and new.consent_status = 'revoked')
         or new.consent_status = old.consent_status) then
      raise exception 'invalid consent transition';
    end if;
    perform private.audit('shortlist_consent_' || new.consent_status::text, 'shortlist_item', old.id::text, '{}');
    return new;
  end if;
  if not private.can_staff_shortlist(_sl) then raise exception 'not allowed'; end if;
  if exists (select 1 from public.shortlists s where s.id = _sl and s.status = 'submitted') then
    raise exception 'a submitted shortlist is immutable';
  end if;
  if tg_op = 'UPDATE' and new.consent_status is distinct from old.consent_status then
    raise exception 'only the candidate can change consent';
  end if;
  if tg_op = 'INSERT' and new.consent_status <> 'pending' then
    raise exception 'consent starts as pending';
  end if;
  return coalesce(new, old);
end $$;
create trigger shortlist_items_guard before insert or update or delete on public.shortlist_items
  for each row execute function public.guard_shortlist_item();
revoke execute on function public.guard_shortlist_item() from public, anon, authenticated;

-- The ONLY way a client company sees candidates: submitted shortlists of its own requests/jobs,
-- anonymised unless the candidate granted consent for full disclosure.
create view public.client_shortlist_view with (security_invoker = false) as
select
  i.id as item_id,
  i.shortlist_id,
  s.title as shortlist_title,
  'Candidate ' || upper(substr(replace(i.id::text, '-', ''), 1, 6)) as reference,
  case when i.disclosure = 'full' and i.consent_status = 'granted' then p.full_name end as full_name,
  case when i.disclosure = 'full' and i.consent_status = 'granted' then p.phone end as phone,
  cp.headline, cp.summary, cp.years_experience, cp.seniority, cp.preferred_functions
from public.shortlist_items i
join public.shortlists s on s.id = i.shortlist_id
left join public.candidate_profiles cp on cp.user_id = i.candidate_id
left join public.profiles p on p.id = i.candidate_id
where s.status = 'submitted'
  and private.company_role_of(private.company_of_shortlist(s.id)) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager')
  and i.consent_status in ('pending', 'granted')
  and (i.disclosure = 'anonymized' or i.consent_status = 'granted');
revoke all on public.client_shortlist_view from public, anon, authenticated;
grant select on public.client_shortlist_view to authenticated;

-- ---------------------------------------------------------------- interviews
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade,
  shortlist_item_id uuid references public.shortlist_items(id) on delete cascade,
  scheduled_at timestamptz not null,
  duration_minutes smallint not null default 45 check (duration_minutes between 5 and 480),
  mode public.interview_mode not null default 'onsite',
  location_note text check (location_note is null or char_length(location_note) <= 500),
  status public.interview_status not null default 'scheduled',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint interviews_one_target check (num_nonnulls(application_id, shortlist_item_id) = 1)
);
create index interviews_application_idx on public.interviews(application_id);
create index interviews_item_idx on public.interviews(shortlist_item_id);
create index interviews_created_by_idx on public.interviews(created_by);

create table public.interview_feedback (
  id uuid primary key default gen_random_uuid(),
  interview_id uuid not null references public.interviews(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  recommendation text check (recommendation is null or recommendation in ('advance', 'hold', 'decline')),
  body text not null check (char_length(btrim(body)) between 1 and 3000),
  created_at timestamptz not null default now()
);
create index interview_feedback_interview_idx on public.interview_feedback(interview_id);
create index interview_feedback_author_idx on public.interview_feedback(author_id);

create or replace function private.can_manage_interview(_interview uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.is_next_staff() or exists (
    select 1 from public.interviews i join public.applications a on a.id = i.application_id
    where i.id = _interview and private.can_manage_direct_job(a.job_id));
$$;

create or replace function private.can_see_interview(_interview uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.can_manage_interview(_interview) or exists (
    select 1 from public.interviews i
    left join public.applications a on a.id = i.application_id
    left join public.shortlist_items si on si.id = i.shortlist_item_id
    where i.id = _interview
      and (a.candidate_id = auth.uid() or (si.candidate_id = auth.uid() and si.consent_status = 'granted'))
  );
$$;

-- ---------------------------------------------------------------- job alerts
create table public.job_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text check (keyword is null or char_length(keyword) <= 80),
  industry text check (industry is null or industry ~ '^[a-z0-9-]{2,40}$'),
  city text check (city is null or char_length(city) <= 80),
  frequency public.alert_frequency not null default 'weekly',
  active boolean not null default true,
  last_sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index job_alerts_user_idx on public.job_alerts(user_id);

create or replace function public.guard_job_alert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.job_alerts where user_id = new.user_id) >= 10 then
    raise exception 'at most 10 job alerts per user';
  end if;
  return new;
end $$;
create trigger job_alerts_guard before insert on public.job_alerts
  for each row execute function public.guard_job_alert();
revoke execute on function public.guard_job_alert() from public, anon, authenticated;

-- ---------------------------------------------------------------- content CMS
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  language text not null default 'ar' check (language in ('ar', 'en')),
  title text not null check (char_length(btrim(title)) between 3 and 200),
  excerpt text check (excerpt is null or char_length(excerpt) <= 400),
  body text not null check (char_length(body) between 1 and 60000),
  category text not null check (category in (
    'career_article', 'recruitment_guide', 'interview_advice', 'industry_insight',
    'labour_market_update', 'salary_report', 'workforce_planning', 'company_announcement')),
  author_id uuid not null references auth.users(id),
  author_name text not null check (char_length(btrim(author_name)) between 2 and 120),
  status public.article_status not null default 'draft',
  published_at timestamptz,
  seo_title text check (seo_title is null or char_length(seo_title) <= 70),
  seo_description text check (seo_description is null or char_length(seo_description) <= 170),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger articles_updated before update on public.articles
  for each row execute function public.set_updated_at();
create index articles_author_idx on public.articles(author_id);
create index articles_public_idx on public.articles(published_at desc) where status = 'published';

create or replace function public.guard_article()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not private.is_next_admin() then raise exception 'only NEXT admins can publish articles'; end if;
    new.published_at := coalesce(new.published_at, now());
    perform private.audit('article_published', 'article', new.id::text, jsonb_build_object('slug', new.slug));
  end if;
  if tg_op = 'UPDATE' and old.status = 'published' and new.status <> 'published' and not private.is_next_admin() then
    raise exception 'only NEXT admins can unpublish articles';
  end if;
  return new;
end $$;
create trigger articles_guard before insert or update on public.articles
  for each row execute function public.guard_article();
revoke execute on function public.guard_article() from public, anon, authenticated;

-- ---------------------------------------------------------------- applications: managed jobs go to NEXT staff only
-- Candidates apply through job_listings, which can include hidden-employer jobs they cannot read in `jobs`.
-- A definer helper keeps the insert check independent of the caller's jobs visibility.
create or replace function private.job_accepts_applications(_job uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.jobs j join public.companies c on c.id = j.company_id
    where j.id = _job and j.status = 'published'
      and j.recruitment_method <> 'confidential_executive'
      and (j.deadline is null or j.deadline >= current_date)
      and c.verification = 'approved');
$$;
revoke execute on function private.job_accepts_applications(uuid) from public, anon;
grant execute on function private.job_accepts_applications(uuid) to authenticated;

drop policy applications_candidate_insert on public.applications;
create policy applications_candidate_insert on public.applications
  for insert to authenticated
  with check (candidate_id = auth.uid() and status = 'new' and private.job_accepts_applications(job_id));

create or replace function public.guard_application_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _is_member boolean;
begin
  _is_member := private.can_manage_direct_job(new.job_id);
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

drop policy applications_company_read on public.applications;
create policy applications_company_read on public.applications
  for select to authenticated
  using (private.is_next_staff() or private.can_manage_direct_job(job_id));

drop policy applications_status_update on public.applications;
create policy applications_status_update on public.applications
  for update to authenticated
  using (candidate_id = auth.uid() or private.is_next_staff() or private.can_manage_direct_job(job_id))
  with check (true); -- transition rules live in guard_application_write()

drop policy notes_company_read on public.application_notes;
create policy notes_company_read on public.application_notes
  for select to authenticated
  using (private.is_next_staff()
         or exists (select 1 from public.applications a where a.id = application_id and private.can_manage_direct_job(a.job_id)));
drop policy notes_company_insert on public.application_notes;
create policy notes_company_insert on public.application_notes
  for insert to authenticated
  with check (author_id = auth.uid()
              and (private.is_next_staff()
                   or exists (select 1 from public.applications a where a.id = application_id and private.can_manage_direct_job(a.job_id))));

drop policy profiles_select_applicants on public.profiles;
create policy profiles_select_applicants on public.profiles
  for select to authenticated
  using (exists (select 1 from public.applications a
                 where a.candidate_id = profiles.id and private.can_manage_direct_job(a.job_id)));

-- ---------------------------------------------------------------- privileges (least privilege)
revoke execute on function
  private.can_manage_direct_job(uuid), private.has_active_pool_consent(uuid), private.is_request_staff(uuid),
  private.can_staff_shortlist(uuid), private.company_of_shortlist(uuid), private.can_manage_interview(uuid),
  private.can_see_interview(uuid)
  from public, anon;
grant execute on function
  private.can_manage_direct_job(uuid), private.has_active_pool_consent(uuid), private.is_request_staff(uuid),
  private.can_staff_shortlist(uuid), private.company_of_shortlist(uuid), private.can_manage_interview(uuid),
  private.can_see_interview(uuid)
  to authenticated;

revoke all on public.talent_pool_consents, public.candidate_profiles, public.resumes,
              public.recruitment_requests, public.agency_assignments, public.shortlists, public.shortlist_items,
              public.interviews, public.interview_feedback, public.job_alerts, public.articles
  from anon, authenticated;
grant select, insert on public.talent_pool_consents to authenticated;          -- append-only history
grant select, insert, update, delete on public.candidate_profiles, public.resumes, public.job_alerts to authenticated;
grant select, insert on public.recruitment_requests to authenticated;
grant update (status) on public.recruitment_requests to authenticated;
grant select, insert, delete on public.agency_assignments to authenticated;
grant select, insert, update on public.shortlists to authenticated;
grant select, insert, update, delete on public.shortlist_items to authenticated;
grant select, insert, update on public.interviews to authenticated;
grant select, insert on public.interview_feedback to authenticated;
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;

-- ---------------------------------------------------------------- RLS
alter table public.talent_pool_consents enable row level security;
alter table public.candidate_profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.recruitment_requests enable row level security;
alter table public.agency_assignments enable row level security;
alter table public.shortlists enable row level security;
alter table public.shortlist_items enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_feedback enable row level security;
alter table public.job_alerts enable row level security;
alter table public.articles enable row level security;

-- consent history: own rows; staff may read for operations/audit
create policy consents_select on public.talent_pool_consents
  for select to authenticated using (user_id = auth.uid() or private.is_next_staff());
create policy consents_insert on public.talent_pool_consents
  for insert to authenticated with check (user_id = auth.uid());

-- candidate profiles: owner full control; NEXT staff only for consenting, non-private profiles
create policy cprofile_own_all on public.candidate_profiles
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy cprofile_staff_read on public.candidate_profiles
  for select to authenticated
  using (private.is_next_staff() and resume_visibility <> 'private' and private.has_active_pool_consent(user_id));

create policy resumes_own_all on public.resumes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy resumes_staff_read on public.resumes
  for select to authenticated
  using (private.is_next_staff()
         and exists (select 1 from public.candidate_profiles cp
                     where cp.user_id = resumes.user_id and cp.resume_visibility = 'searchable')
         and private.has_active_pool_consent(user_id));

-- recruitment requests
create policy requests_company_read on public.recruitment_requests
  for select to authenticated
  using (private.company_role_of(company_id) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager')
         or private.is_request_staff(id));
create policy requests_insert on public.recruitment_requests
  for insert to authenticated
  with check (requester_id = auth.uid()
              and (private.company_role_of(company_id) in ('owner', 'hr_manager') or private.is_next_staff()));
create policy requests_update on public.recruitment_requests
  for update to authenticated
  using (private.is_request_staff(id) or private.company_role_of(company_id) in ('owner', 'hr_manager'))
  with check (true); -- transitions enforced in guard_request_write()

create policy assignments_select on public.agency_assignments
  for select to authenticated using (recruiter_id = auth.uid() or private.is_next_admin());
create policy assignments_admin_insert on public.agency_assignments
  for insert to authenticated with check (private.is_next_admin());
create policy assignments_admin_delete on public.agency_assignments
  for delete to authenticated using (private.is_next_admin());

-- shortlists: staff manage; companies read ONLY submitted ones of their own request/job (header, not candidates)
create policy shortlists_staff on public.shortlists
  for all to authenticated
  using (private.can_staff_shortlist(id))
  with check (private.is_next_staff());
create policy shortlists_company_read on public.shortlists
  for select to authenticated
  using (status = 'submitted'
         and private.company_role_of(private.company_of_shortlist(id)) in ('owner', 'hr_manager', 'recruiter', 'hiring_manager'));

-- shortlist items: staff only. Candidates have NO direct access (the row holds the internal recruiter_note);
-- they see their consent requests through my_consent_requests and answer through respond_shortlist_consent().
-- Companies use client_shortlist_view only.
create policy sitems_staff on public.shortlist_items
  for all to authenticated
  using (private.can_staff_shortlist(shortlist_id))
  with check (private.is_next_staff());

create view public.my_consent_requests with (security_invoker = false) as
select
  i.id as item_id, i.disclosure, i.consent_status, i.created_at,
  case when coalesce(r.confidential, j.hide_employer, false) then null else co.name end as company_name
from public.shortlist_items i
join public.shortlists s on s.id = i.shortlist_id
left join public.recruitment_requests r on r.id = s.request_id
left join public.jobs j on j.id = s.job_id
left join public.companies co on co.id = coalesce(r.company_id, j.company_id)
where i.candidate_id = auth.uid() and i.disclosure = 'full';
revoke all on public.my_consent_requests from public, anon, authenticated;
grant select on public.my_consent_requests to authenticated;

create or replace function public.respond_shortlist_consent(_item uuid, _grant boolean)
returns public.item_consent language plpgsql security definer set search_path = public as $$
declare _cur public.item_consent; _new public.item_consent;
begin
  select consent_status into _cur from public.shortlist_items where id = _item and candidate_id = auth.uid();
  if not found then raise exception 'not found'; end if;
  _new := case when _grant then 'granted' when _cur = 'granted' then 'revoked' else 'declined' end;
  update public.shortlist_items set consent_status = _new where id = _item and candidate_id = auth.uid();
  return _new;
end $$;
revoke execute on function public.respond_shortlist_consent(uuid, boolean) from public, anon;
grant execute on function public.respond_shortlist_consent(uuid, boolean) to authenticated;

-- interviews
create policy interviews_select on public.interviews
  for select to authenticated using (private.can_see_interview(id));
create policy interviews_insert on public.interviews
  for insert to authenticated
  with check (created_by = auth.uid()
              and (private.is_next_staff()
                   or (application_id is not null
                       and exists (select 1 from public.applications a
                                   where a.id = application_id and private.can_manage_direct_job(a.job_id)))));
create policy interviews_update on public.interviews
  for update to authenticated using (private.can_manage_interview(id)) with check (private.can_manage_interview(id));

-- interview feedback is internal (company side + NEXT); never candidate-visible
create policy feedback_select on public.interview_feedback
  for select to authenticated using (private.can_manage_interview(interview_id));
create policy feedback_insert on public.interview_feedback
  for insert to authenticated
  with check (author_id = auth.uid() and private.can_manage_interview(interview_id));

-- job alerts: own only
create policy alerts_own_all on public.job_alerts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- articles: public sees published; staff draft; only admins publish (guard) or delete
create policy articles_public_read on public.articles
  for select to anon, authenticated using (status = 'published' and published_at <= now());
create policy articles_staff_read on public.articles
  for select to authenticated using (private.is_next_staff());
create policy articles_staff_insert on public.articles
  for insert to authenticated with check (private.is_next_staff() and author_id = auth.uid());
create policy articles_staff_update on public.articles
  for update to authenticated using (private.is_next_staff()) with check (private.is_next_staff());
create policy articles_admin_delete on public.articles
  for delete to authenticated using (private.is_next_admin());
