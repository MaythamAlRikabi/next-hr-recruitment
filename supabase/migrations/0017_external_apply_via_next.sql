-- NEXT | HR & Recruitment — Migration 0017: "apply via NEXT" for imported ads (eligibility phase 2).
-- STATUS: applied to the real database on 2026-10-31 (owner approved); verified view column, RLS, trigger and grants. The UI stays hidden until RESEND_API_KEY + NEXT_MAIL_FROM are set.
--
-- A candidate who meets an imported ad's REQUIRED conditions can send their CV to the ad's own e-mail address through NEXT;
-- the e-mail carries a reference code, so the company knows the application came through NEXT and that the candidate meets the conditions.
--  * external_jobs.criteria (added in 0015) is now exposed through external_job_listings (last column) and editable by staff.
--  * external_applications: one row per (imported ad, candidate); eligibility snapshot, reference code, delivery status.
--    The candidate can create and read their own rows; only the server (service role) can mark a row sent / failed,
--    so a row can never claim "sent" unless the server really sent the e-mail.
--  * the insert trigger enforces: ad is published, not expired, has an apply e-mail; every REQUIRED condition met; max 10 per 24 h.
--  * verify_external_application(ref): public check of a reference code, returns no personal data.

create or replace view public.external_job_listings with (security_invoker = false) as
select
  e.id, e.title, e.agency, e.client_note, e.city, e.industry, e.employment_type,
  e.salary_min, e.salary_max, e.salary_currency, e.salary_note,
  e.responsibilities, e.requirements, e.apply_url, e.apply_email, e.source_label,
  case when e.source_url ~* '^https?://(www\.)?(t\.me|telegram\.me|telegram\.dog)/' then null else e.source_url end as source_url,
  e.language, e.posted_at, e.published_at, e.expires_at, e.apply_phone,
  e.criteria
from public.external_jobs e
where e.status = 'published' and e.expires_at > now();

-- The checklist for the signed-in candidate (same engine as public.job_fit).
create or replace function public.external_job_fit(_job uuid) returns jsonb
language sql stable security definer set search_path = 'public' as $$
  select private.criteria_fit(
    (select criteria from public.external_jobs where id = _job and status = 'published' and expires_at > now()), auth.uid())
$$;
revoke all on function public.external_job_fit(uuid) from public, anon;
grant execute on function public.external_job_fit(uuid) to authenticated;

create table public.external_applications (
  id uuid primary key default gen_random_uuid(),
  external_job_id uuid not null references public.external_jobs (id) on delete cascade,
  candidate_id uuid not null references auth.users (id) on delete cascade,
  ref_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  cover_note text check (char_length(cover_note) <= 2000),
  resume_id uuid references public.resumes (id) on delete set null,
  eligibility jsonb,
  consent_at timestamptz not null default now(),
  sent_at timestamptz,
  error text check (char_length(error) <= 300),
  created_at timestamptz not null default now(),
  unique (external_job_id, candidate_id)
);
create index external_applications_candidate_idx on public.external_applications (candidate_id, created_at desc);

alter table public.external_applications enable row level security;
revoke all on public.external_applications from anon, authenticated;
grant select, insert, delete on public.external_applications to authenticated;

create policy external_applications_owner_select on public.external_applications
  for select to authenticated using (candidate_id = (select auth.uid()));
create policy external_applications_staff_select on public.external_applications
  for select to authenticated using (private.is_next_staff());
create policy external_applications_owner_insert on public.external_applications
  for insert to authenticated with check (candidate_id = (select auth.uid()));
-- a failed delivery can be retried: the candidate may delete only their own FAILED row
create policy external_applications_owner_delete_failed on public.external_applications
  for delete to authenticated using (candidate_id = (select auth.uid()) and status = 'failed');

create or replace function private.enforce_external_apply() returns trigger
language plpgsql security definer set search_path = 'public' as $$
declare j record; fit jsonb;
begin
  select id, criteria, apply_email into j from public.external_jobs
   where id = new.external_job_id and status = 'published' and expires_at > now();
  if not found or j.apply_email is null then raise exception 'not_open' using errcode = 'P0001'; end if;
  if new.resume_id is not null and not exists (select 1 from public.resumes r where r.id = new.resume_id and r.user_id = new.candidate_id) then
    raise exception 'invalid_resume' using errcode = 'P0001';
  end if;
  if (select count(*) from public.external_applications a where a.candidate_id = new.candidate_id and a.created_at > now() - interval '24 hours') >= 10 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  fit := private.criteria_fit(j.criteria, new.candidate_id);
  if not (fit ->> 'eligible')::boolean then raise exception 'not_eligible' using errcode = 'P0001'; end if;
  new.eligibility := fit; new.status := 'queued'; new.sent_at := null; new.error := null; new.consent_at := now();
  return new;
end $$;
revoke all on function private.enforce_external_apply() from public, anon, authenticated;
create trigger external_applications_enforce before insert on public.external_applications for each row execute function private.enforce_external_apply();

-- Only the server (service role) records the delivery result.
create or replace function public.mark_external_application(_id uuid, _status text, _error text default null) returns void
language sql security definer set search_path = 'public' as $$
  update public.external_applications
     set status = _status, sent_at = case when _status = 'sent' then now() end, error = left(_error, 300)
   where id = _id and status = 'queued' and _status in ('sent', 'failed')
$$;
revoke all on function public.mark_external_application(uuid, text, text) from public, anon, authenticated;
grant execute on function public.mark_external_application(uuid, text, text) to service_role;

-- Public check of a reference code (what the company sees): no names, no contact details.
create or replace function public.verify_external_application(_ref text) returns jsonb
language sql stable security definer set search_path = 'public' as $$
  select jsonb_build_object(
    'title', j.title, 'agency', j.agency, 'sent_at', a.sent_at,
    'eligible', (a.eligibility ->> 'eligible')::boolean,
    'required_total', (a.eligibility ->> 'required_total')::int, 'required_met', (a.eligibility ->> 'required_met')::int,
    'verified', coalesce((select bool_and((r ->> 'verified')::boolean) from jsonb_array_elements(a.eligibility -> 'results') r where (r ->> 'required')::boolean), false))
  from public.external_applications a join public.external_jobs j on j.id = a.external_job_id
  where a.ref_code = upper(btrim(_ref)) and a.status = 'sent'
$$;
revoke all on function public.verify_external_application(text) from public;
grant execute on function public.verify_external_application(text) to anon, authenticated;
