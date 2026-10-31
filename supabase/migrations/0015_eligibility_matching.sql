-- NEXT | HR & Recruitment — Migration 0015: "eligible to apply" matching (phase 1).
-- STATUS: applied to the real database on 2026-10-31 (owner approved the feature: "ابدأ"); verified: view column, tables, grants, trigger.
--
-- Idea (owner): a candidate can apply to a NEXT job only if their profile meets the job's REQUIRED conditions
-- (e.g. degree in pharmacy, 2 years in sales); the candidate sees what is met / missing, the employer sees the result.
--
-- Design:
--  * candidate_education / candidate_experience: structured profile facts (controlled field slugs, see src/lib/eligibility.ts).
--  * jobs.criteria / external_jobs.criteria: jsonb array of rules, each { kind, ..., required }:
--      { "kind":"education",  "field":"pharmacy", "level":"bachelor", "required":true }   (field and/or level)
--      { "kind":"experience", "field":"sales", "min_years":2, "required":true }
--    "required": false = shown as preferred, never blocks.
--  * private.job_fit_for(job, candidate): the ONE implementation of the check. Used by the apply trigger (enforcement, cannot
--    be bypassed through the API) and by public.job_fit(job) (the page checklist, always for the signed-in user only).
--  * applications.eligibility: snapshot of the result at the time of applying (employer sees it).
--  * Facts are self-declared by the candidate; the UI says so. Document verification comes later.
-- Existing jobs get criteria = [] (no conditions), so nothing changes for them.

-- ---------- structured profile facts ----------
create table public.candidate_education (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  level text not null check (level in ('high_school', 'diploma', 'bachelor', 'master', 'doctorate')),
  field text not null check (field ~ '^[a-z][a-z-]{1,39}$'),
  institution text check (char_length(institution) <= 120),
  graduation_year integer check (graduation_year between 1960 and 2100),
  created_at timestamptz not null default now()
);
create index candidate_education_user_idx on public.candidate_education (user_id);

create table public.candidate_experience (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  field text not null check (field ~ '^[a-z][a-z-]{1,39}$'),
  months integer not null check (months between 1 and 600),
  created_at timestamptz not null default now()
);
create index candidate_experience_user_idx on public.candidate_experience (user_id);

alter table public.candidate_education enable row level security;
alter table public.candidate_experience enable row level security;

create policy candidate_education_owner on public.candidate_education
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy candidate_education_staff_read on public.candidate_education
  for select to authenticated using (private.is_next_staff());
create policy candidate_experience_owner on public.candidate_experience
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy candidate_experience_staff_read on public.candidate_experience
  for select to authenticated using (private.is_next_staff());

revoke all on public.candidate_education, public.candidate_experience from anon;

-- At most 15 rows per candidate per table.
create or replace function private.cap_candidate_rows() returns trigger
language plpgsql set search_path = '' as $$
declare n integer;
begin
  execute format('select count(*) from public.%I where user_id = $1', tg_table_name) into n using new.user_id;
  if n >= 15 then raise exception 'too_many_rows' using errcode = 'P0001'; end if;
  return new;
end $$;
create trigger candidate_education_cap before insert on public.candidate_education for each row execute function private.cap_candidate_rows();
create trigger candidate_experience_cap before insert on public.candidate_experience for each row execute function private.cap_candidate_rows();

-- ---------- criteria on jobs ----------
create or replace function private.edu_rank(_level text) returns integer
language sql immutable set search_path = '' as $$
  select case _level when 'high_school' then 1 when 'diploma' then 2 when 'bachelor' then 3 when 'master' then 4 when 'doctorate' then 5 else 0 end
$$;

create or replace function private.valid_criteria(_c jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
declare e jsonb;
begin
  if jsonb_typeof(_c) <> 'array' or jsonb_array_length(_c) > 8 then return false; end if;
  for e in select * from jsonb_array_elements(_c) loop
    if jsonb_typeof(e) <> 'object' then return false; end if;
    if e ->> 'kind' = 'education' then
      if (e ->> 'field') is null and (e ->> 'level') is null then return false; end if;
      if (e ->> 'field') is not null and (e ->> 'field') !~ '^[a-z][a-z-]{1,39}$' then return false; end if;
      if (e ->> 'level') is not null and private.edu_rank(e ->> 'level') = 0 then return false; end if;
    elsif e ->> 'kind' = 'experience' then
      if (e ->> 'field') is null or (e ->> 'field') !~ '^[a-z][a-z-]{1,39}$' then return false; end if;
      if (e ->> 'min_years') is not null and ((e ->> 'min_years') !~ '^[0-9]{1,2}(\.5)?$') then return false; end if;
    else
      return false;
    end if;
    if (e -> 'required') is not null and jsonb_typeof(e -> 'required') <> 'boolean' then return false; end if;
  end loop;
  return true;
end $$;

alter table public.jobs add column criteria jsonb not null default '[]'::jsonb check (private.valid_criteria(criteria));
alter table public.external_jobs add column criteria jsonb not null default '[]'::jsonb check (private.valid_criteria(criteria));
alter table public.applications add column eligibility jsonb;

-- ---------- the check (single implementation) ----------
create or replace function private.job_fit_for(_job uuid, _cand uuid) returns jsonb
language plpgsql stable security definer set search_path = 'public' as $$
declare
  crit jsonb; c jsonb; res jsonb := '[]'::jsonb; ok boolean; v_months integer;
  req_total integer := 0; req_met integer := 0; is_req boolean;
begin
  select criteria into crit from public.jobs where id = _job;
  for c in select * from jsonb_array_elements(coalesce(crit, '[]'::jsonb)) loop
    v_months := null;
    if c ->> 'kind' = 'education' then
      ok := exists (
        select 1 from public.candidate_education e
        where e.user_id = _cand
          and ((c ->> 'field') is null or e.field = c ->> 'field')
          and ((c ->> 'level') is null or private.edu_rank(e.level) >= private.edu_rank(c ->> 'level')));
    elsif c ->> 'kind' = 'experience' then
      select coalesce(sum(x.months), 0) into v_months from public.candidate_experience x where x.user_id = _cand and x.field = c ->> 'field';
      ok := v_months >= greatest(coalesce((c ->> 'min_years')::numeric, 0) * 12, 1);
    else
      continue;
    end if;
    is_req := coalesce((c ->> 'required')::boolean, true);
    if is_req then req_total := req_total + 1; if ok then req_met := req_met + 1; end if; end if;
    res := res || jsonb_build_array(c || jsonb_build_object('required', is_req, 'met', ok) || case when v_months is null then '{}'::jsonb else jsonb_build_object('have_months', v_months) end);
  end loop;
  return jsonb_build_object('eligible', req_met = req_total, 'required_total', req_total, 'required_met', req_met, 'results', res);
end $$;
revoke all on function private.job_fit_for(uuid, uuid) from public, anon, authenticated;

-- The page checklist: always about the signed-in user.
create or replace function public.job_fit(_job uuid) returns jsonb
language sql stable security definer set search_path = 'public' as $$
  select private.job_fit_for(_job, auth.uid())
$$;
revoke all on function public.job_fit(uuid) from public, anon;
grant execute on function public.job_fit(uuid) to authenticated;

-- ---------- enforcement: cannot apply unless every REQUIRED condition is met ----------
create or replace function private.enforce_eligibility() returns trigger
language plpgsql security definer set search_path = 'public' as $$
declare fit jsonb;
begin
  fit := private.job_fit_for(new.job_id, new.candidate_id);
  if not (fit ->> 'eligible')::boolean then
    raise exception 'not_eligible' using errcode = 'P0001';
  end if;
  new.eligibility := fit;
  return new;
end $$;
create trigger applications_eligibility before insert on public.applications for each row execute function private.enforce_eligibility();

-- ---------- public job view exposes the conditions (last column keeps existing grants) ----------
create or replace view public.job_listings with (security_invoker = false) as
select
  j.id, j.title, j.description, j.requirements, j.industry, j.city, j.country, j.employment_type, j.work_mode, j.seniority,
  j.recruitment_method, j.deadline, j.published_at,
  case when j.show_salary then j.salary_min else null::integer end as salary_min,
  case when j.show_salary then j.salary_max else null::integer end as salary_max,
  case when j.show_salary then j.salary_currency else null::text end as salary_currency,
  case when j.hide_employer then null::uuid else j.company_id end as company_id,
  case when j.hide_employer then null::text else c.name end as company_name,
  j.hide_employer as employer_hidden,
  j.criteria
from public.jobs j
join public.companies c on c.id = j.company_id
where j.status = 'published'::job_status
  and j.recruitment_method <> 'confidential_executive'::recruitment_method
  and (j.deadline is null or j.deadline >= current_date)
  and c.verification = 'approved'::verification_status;
