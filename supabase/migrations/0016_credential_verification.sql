-- NEXT | HR & Recruitment — Migration 0016: document verification of education / experience (eligibility phase 3).
-- STATUS: applied to the real database on 2026-10-31 (owner approved); verified columns, triggers, bucket and storage policies.
--
-- Idea: a candidate may attach ONE proof file (degree certificate / employment letter) to an education or experience row.
-- NEXT staff review it; an approved row becomes 'verified' and shows a "موثّق" badge to employers.
--  * verification: none -> pending (candidate attaches a proof) -> verified | rejected (staff only).
--  * a trigger makes it impossible for a candidate (or the API) to set verified/rejected, or to keep a verification after the
--    row's content changes; staff cannot verify their own rows and cannot edit a candidate's content.
--  * proof files live in a PRIVATE bucket "credentials", folder "<uid>/…"; read by the owner and NEXT staff only (never employers).
--  * private.criteria_fit(criteria, candidate) is now the single implementation of the check (jobs AND imported ads); it also
--    reports, per condition, whether the matching facts are verified.

alter table public.candidate_education
  add column proof_path text, add column proof_name text,
  add column verification text not null default 'none',
  add column verified_at timestamptz, add column verified_by uuid references auth.users (id) on delete set null,
  add constraint candidate_education_verification_chk check (verification in ('none', 'pending', 'verified', 'rejected')),
  add constraint candidate_education_proof_chk check (proof_path is null or (proof_path like user_id::text || '/%' and char_length(proof_name) <= 200)),
  add constraint candidate_education_pending_chk check (verification not in ('pending', 'verified') or proof_path is not null);
alter table public.candidate_experience
  add column proof_path text, add column proof_name text,
  add column verification text not null default 'none',
  add column verified_at timestamptz, add column verified_by uuid references auth.users (id) on delete set null,
  add constraint candidate_experience_verification_chk check (verification in ('none', 'pending', 'verified', 'rejected')),
  add constraint candidate_experience_proof_chk check (proof_path is null or (proof_path like user_id::text || '/%' and char_length(proof_name) <= 200)),
  add constraint candidate_experience_pending_chk check (verification not in ('pending', 'verified') or proof_path is not null);

create index candidate_education_pending_idx on public.candidate_education (created_at) where verification = 'pending';
create index candidate_experience_pending_idx on public.candidate_experience (created_at) where verification = 'pending';

-- ---------- who may change what ----------
create or replace function private.guard_credential() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  staff boolean := private.is_next_staff() and new.user_id is distinct from auth.uid();
  skip text[] := array['verification', 'verified_at', 'verified_by', 'proof_path', 'proof_name', 'created_at'];
  content_changed boolean;
begin
  if tg_op = 'INSERT' then
    if not staff then
      new.verification := 'none'; new.verified_at := null; new.verified_by := null; new.proof_path := null; new.proof_name := null;
    end if;
    return new;
  end if;

  content_changed := (to_jsonb(new) - skip) is distinct from (to_jsonb(old) - skip);
  if staff then
    if content_changed or new.proof_path is distinct from old.proof_path or new.proof_name is distinct from old.proof_name then
      raise exception 'invalid_review' using errcode = 'P0001';
    end if;
    if new.verification is distinct from old.verification then
      if old.verification <> 'pending' or new.verification not in ('verified', 'rejected') then
        raise exception 'invalid_review' using errcode = 'P0001';
      end if;
      new.verified_at := now(); new.verified_by := auth.uid();
    else
      new.verified_at := old.verified_at; new.verified_by := old.verified_by;
    end if;
    return new;
  end if;

  -- the owner
  if content_changed then
    new.verification := 'none'; new.proof_path := null; new.proof_name := null; new.verified_at := null; new.verified_by := null;
  elsif new.proof_path is distinct from old.proof_path then
    new.verified_at := null; new.verified_by := null;
    new.verification := case when new.proof_path is null then 'none' else 'pending' end;
    if new.proof_path is null then new.proof_name := null; end if;
  else
    new.verification := old.verification; new.verified_at := old.verified_at; new.verified_by := old.verified_by;
  end if;
  return new;
end $$;
revoke all on function private.guard_credential() from public, anon, authenticated;
create trigger candidate_education_guard before insert or update on public.candidate_education for each row execute function private.guard_credential();
create trigger candidate_experience_guard before insert or update on public.candidate_experience for each row execute function private.guard_credential();

create policy candidate_education_staff_review on public.candidate_education
  for update to authenticated using (private.is_next_staff()) with check (private.is_next_staff());
create policy candidate_experience_staff_review on public.candidate_experience
  for update to authenticated using (private.is_next_staff()) with check (private.is_next_staff());

-- ---------- the check: one implementation for jobs and imported ads ----------
create or replace function private.criteria_fit(_crit jsonb, _cand uuid) returns jsonb
language plpgsql stable security definer set search_path = 'public' as $$
declare
  c jsonb; res jsonb := '[]'::jsonb; ok boolean; vok boolean; v_months integer; v_vmonths integer; need numeric;
  req_total integer := 0; req_met integer := 0; is_req boolean;
begin
  for c in select * from jsonb_array_elements(coalesce(_crit, '[]'::jsonb)) loop
    v_months := null; vok := false;
    if c ->> 'kind' = 'education' then
      ok := exists (
        select 1 from public.candidate_education e
        where e.user_id = _cand
          and ((c ->> 'field') is null or e.field = c ->> 'field')
          and ((c ->> 'level') is null or private.edu_rank(e.level) >= private.edu_rank(c ->> 'level')));
      vok := ok and exists (
        select 1 from public.candidate_education e
        where e.user_id = _cand and e.verification = 'verified'
          and ((c ->> 'field') is null or e.field = c ->> 'field')
          and ((c ->> 'level') is null or private.edu_rank(e.level) >= private.edu_rank(c ->> 'level')));
    elsif c ->> 'kind' = 'experience' then
      select coalesce(sum(x.months), 0), coalesce(sum(x.months) filter (where x.verification = 'verified'), 0)
        into v_months, v_vmonths
        from public.candidate_experience x where x.user_id = _cand and x.field = c ->> 'field';
      need := greatest(coalesce((c ->> 'min_years')::numeric, 0) * 12, 1);
      ok := v_months >= need;
      vok := ok and v_vmonths >= need;
    else
      continue;
    end if;
    is_req := coalesce((c ->> 'required')::boolean, true);
    if is_req then req_total := req_total + 1; if ok then req_met := req_met + 1; end if; end if;
    res := res || jsonb_build_array(
      c || jsonb_build_object('required', is_req, 'met', ok, 'verified', vok)
        || case when v_months is null then '{}'::jsonb else jsonb_build_object('have_months', v_months) end);
  end loop;
  return jsonb_build_object('eligible', req_met = req_total, 'required_total', req_total, 'required_met', req_met, 'results', res);
end $$;
revoke all on function private.criteria_fit(jsonb, uuid) from public, anon, authenticated;

create or replace function private.job_fit_for(_job uuid, _cand uuid) returns jsonb
language sql stable security definer set search_path = 'public' as $$
  select private.criteria_fit((select criteria from public.jobs where id = _job), _cand)
$$;
revoke all on function private.job_fit_for(uuid, uuid) from public, anon, authenticated;

-- ---------- proof files: private bucket, owner + NEXT staff only (no employer policy) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('credentials', 'credentials', false, 5242880, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy credentials_obj_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text);
create policy credentials_obj_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text);
create policy credentials_obj_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'credentials' and (storage.foldername(name))[1] = auth.uid()::text);
create policy credentials_obj_select_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'credentials' and private.is_next_staff());
