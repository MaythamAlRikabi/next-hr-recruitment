-- NEXT | HR & Recruitment — Migration 0011: what an applicant shares with the hiring side + mandatory closing date.
-- Depends on 0001-0010.  STATUS: tested on a scratch PostgreSQL (supabase/tests/rls_shares_deadlines.sql).
--
-- A) Application shares
--    When a candidate applies they choose (1) which uploaded CV file to attach and (2) whether to share their profile.
--    The hiring side (company members of a DIRECT job, or NEXT staff for managed jobs) can then read, for THAT application only:
--      * the chosen CV row + file (private bucket, signed URL created server-side), and
--      * the candidate profile row (headline, summary, experience ...).
--    Access ends when the application is withdrawn. Nothing else of the candidate becomes visible.
--
-- B) Mandatory closing date
--    Every job needs a closing date (today .. +180 days). After it passes the job is hidden/closed to applications at once
--    (RLS already did that) and public.close_expired_jobs() — run daily by the cron — flips the status:
--    published -> closed, never-published drafts -> archived. Applications and history are kept.

-- ---------------------------------------------------------------- A) application shares
alter table public.applications
  add column resume_id uuid references public.resumes(id) on delete set null,
  add column share_profile boolean not null default true;
create index applications_resume_idx on public.applications(resume_id) where resume_id is not null;

-- The attached CV must belong to the applicant.
create or replace function public.guard_application_share()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.resume_id is not null
     and not exists (select 1 from public.resumes r where r.id = new.resume_id and r.user_id = new.candidate_id) then
    raise exception 'the attached CV must be one of your own files';
  end if;
  return new;
end $$;
create trigger applications_share_guard before insert on public.applications
  for each row execute function public.guard_application_share();
revoke execute on function public.guard_application_share() from public, anon, authenticated;

-- Hiring side may read the CV row / profile row of an applicant who attached / shared it.
-- The subselect runs under the caller's RLS on applications (own company's applicants or NEXT staff only).
create policy resumes_applicant_read on public.resumes
  for select to authenticated
  using (exists (select 1 from public.applications a
                 where a.resume_id = resumes.id and a.status <> 'withdrawn'
                   and (private.is_next_staff() or private.can_manage_direct_job(a.job_id))));

create policy cprofile_applicant_read on public.candidate_profiles
  for select to authenticated
  using (exists (select 1 from public.applications a
                 where a.candidate_id = candidate_profiles.user_id and a.share_profile and a.status <> 'withdrawn'
                   and (private.is_next_staff() or private.can_manage_direct_job(a.job_id))));

-- Storage: the file itself, only when its resumes row is attached to an application the caller may manage.
create policy resumes_obj_select_applicant on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and exists (select 1 from public.resumes r
                join public.applications a on a.resume_id = r.id
                where r.storage_path = storage.objects.name and a.status <> 'withdrawn'
                  and (private.is_next_staff() or private.can_manage_direct_job(a.job_id)))
  );

-- ---------------------------------------------------------------- B) mandatory closing date
-- No real jobs exist yet (checked on the live project), so the column can be NOT NULL right away.
update public.jobs set deadline = coalesce(deadline, current_date + 30) where deadline is null;
alter table public.jobs alter column deadline set not null;

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
  -- closing date: today .. +180 days whenever it is set or changed (the daily job only changes status)
  if tg_op = 'INSERT' or new.deadline is distinct from old.deadline then
    if new.deadline < current_date then raise exception 'the closing date cannot be in the past'; end if;
    if new.deadline > current_date + 180 then raise exception 'the closing date is too far away (max 180 days)'; end if;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- Daily housekeeping, called only by the service role (Vercel cron). Applications are kept for the record.
create or replace function public.close_expired_jobs()
returns jsonb language plpgsql security definer set search_path = public as $$
declare _closed int; _archived int; _ext int;
begin
  update public.jobs set status = 'closed' where status = 'published' and deadline < current_date;
  get diagnostics _closed = row_count;
  update public.jobs set status = 'archived' where status in ('draft', 'pending_review') and deadline < current_date;
  get diagnostics _archived = row_count;
  update public.external_jobs set status = 'expired' where status = 'published' and expires_at <= now();
  get diagnostics _ext = row_count;
  return jsonb_build_object('closed', _closed, 'archived', _archived, 'external_expired', _ext);
end $$;
revoke execute on function public.close_expired_jobs() from public, anon, authenticated;
grant execute on function public.close_expired_jobs() to service_role;

-- The importer may only expire a published external job; every other status change stays with NEXT staff.
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
    if system_job then
      if not (old.status = 'published' and new.status = 'expired') then
        raise exception 'only NEXT staff can change the review status';
      end if;
    else
      new.reviewed_by := auth.uid();
    end if;
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;
