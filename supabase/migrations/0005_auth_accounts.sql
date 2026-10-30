-- NEXT | HR & Recruitment — Migration 0005: account purpose + deletion requests
-- * profiles gets account_purpose / terms_accepted_at (informational, set at signup)
-- * handle_new_user: 'candidate' for everyone; additionally 'employer' when the person chose
--   "I'm hiring for a company". Staff roles are NEVER derived from client-supplied metadata.
-- * account_deletion_requests: users file a request; only NEXT admins process it.

alter table public.profiles
  add column account_purpose text not null default 'candidate' check (account_purpose in ('candidate', 'employer')),
  add column terms_accepted_at timestamptz;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  purpose text := case when new.raw_user_meta_data ->> 'account_purpose' = 'employer' then 'employer' else 'candidate' end;
  fname text := nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), '');
begin
  insert into public.profiles (id, full_name, account_purpose, terms_accepted_at)
  values (
    new.id, fname, purpose,
    case when new.raw_user_meta_data ->> 'terms_accepted' = 'true' then now() end
  );
  insert into public.user_roles (user_id, role) values (new.id, 'candidate');
  if purpose = 'employer' then
    insert into public.user_roles (user_id, role) values (new.id, 'employer');
  end if;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create type public.deletion_status as enum ('pending', 'processing', 'completed', 'cancelled');

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text check (reason is null or char_length(reason) <= 1000),
  status public.deletion_status not null default 'pending',
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null
);
create unique index account_deletion_one_pending_idx on public.account_deletion_requests(user_id) where status = 'pending';
create index account_deletion_processed_by_idx on public.account_deletion_requests(processed_by);

alter table public.account_deletion_requests enable row level security;
revoke all on public.account_deletion_requests from anon, authenticated;
grant select, insert, update on public.account_deletion_requests to authenticated;

create policy deletion_select on public.account_deletion_requests
  for select to authenticated using (user_id = auth.uid() or private.is_next_admin());
create policy deletion_insert_own on public.account_deletion_requests
  for insert to authenticated
  with check (user_id = auth.uid() and status = 'pending' and processed_at is null and processed_by is null);
create policy deletion_admin_update on public.account_deletion_requests
  for update to authenticated using (private.is_next_admin()) with check (private.is_next_admin());
