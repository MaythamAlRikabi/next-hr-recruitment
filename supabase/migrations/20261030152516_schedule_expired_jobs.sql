-- Run expiry inside Postgres: no service-role key needs to leave the database.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function public.guard_job_write()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Only the database scheduler/service role may close expired rows without a staff session.
  -- Reject every other column change; this is not a general privileged write bypass.
  if tg_op = 'UPDATE' and auth.uid() is null
     and (session_user in ('postgres', 'supabase_admin') or current_setting('role', true) = 'service_role')
     and old.deadline < current_date
     and ((old.status = 'published' and new.status = 'closed')
       or (old.status in ('draft', 'pending_review') and new.status = 'archived'))
     and (to_jsonb(new) - 'status' - 'updated_at') = (to_jsonb(old) - 'status' - 'updated_at') then
    return new;
  end if;
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


-- Preserve the existing 00:30 UTC schedule (03:30 Baghdad).
select cron.schedule('next-close-expired-jobs', '30 0 * * *', 'select public.close_expired_jobs();');
