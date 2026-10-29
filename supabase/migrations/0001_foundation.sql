-- NEXT | HR & Recruitment — Migration 0001: foundation
-- Roles, profiles, companies, membership + helper functions + RLS.
-- No seed/demo data is inserted here (production-safe). Reference data (roles) only.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- enums
create type public.app_role as enum
  ('candidate', 'employer', 'next_recruiter', 'next_admin', 'super_admin');

create type public.company_role as enum
  ('owner', 'hr_manager', 'recruiter', 'hiring_manager', 'viewer');

create type public.verification_status as enum
  ('pending', 'approved', 'rejected', 'needs_info');

-- ------------------------------------------------------- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text check (phone is null or phone ~ '^\+964[0-9]{9,10}$'),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- roles
create table public.roles (
  role public.app_role primary key,
  description text not null
);
insert into public.roles (role, description) values
  ('candidate', 'Job seeker'),
  ('employer', 'Company user'),
  ('next_recruiter', 'NEXT agency recruiter'),
  ('next_admin', 'NEXT administrator'),
  ('super_admin', 'Super administrator');

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null references public.roles(role),
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_role_idx on public.user_roles(role);

-- ---------------------------------------------------------------- companies
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  industry text,
  country text not null default 'IQ',
  city text,
  business_email text,
  website text,
  description text,
  size_range text,
  logo_path text,
  contact_person text,
  verification public.verification_status not null default 'pending',
  verified_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger companies_updated before update on public.companies
  for each row execute function public.set_updated_at();

create table public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index company_members_user_idx on public.company_members(user_id);
create index companies_created_by_idx on public.companies(created_by);

-- -------------------------------------------------------------- audit log
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs(entity_type, entity_id);

-- --------------------------------------------------------- helper functions
-- SECURITY DEFINER so policies can check roles without recursive RLS.
create or replace function public.has_role(_role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

create or replace function public.is_next_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and role in ('next_recruiter', 'next_admin', 'super_admin')
  );
$$;

create or replace function public.is_next_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role in ('next_admin', 'super_admin')
  );
$$;

create or replace function public.company_role_of(_company uuid)
returns public.company_role language sql stable security definer set search_path = public as $$
  select role from public.company_members
  where company_id = _company and user_id = auth.uid();
$$;

-- New auth user -> profile row + default 'candidate' role.
-- Privileged roles are NEVER assignable from client metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  insert into public.user_roles (user_id, role) values (new.id, 'candidate');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.user_roles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: own row; NEXT staff can read for operations
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_next_staff());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- roles: readable reference data
create policy roles_read on public.roles for select to authenticated using (true);

-- user_roles: read own; only admins may grant/revoke (no self-escalation)
create policy user_roles_select on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_next_admin());
create policy user_roles_admin_write on public.user_roles
  for all to authenticated
  using (public.is_next_admin()) with check (public.is_next_admin());

-- companies: verified companies are public; members see their own; staff see all
create policy companies_public_verified on public.companies
  for select to anon, authenticated using (verification = 'approved');
create policy companies_member_select on public.companies
  for select to authenticated
  using (public.company_role_of(id) is not null
         or created_by = auth.uid()
         or public.is_next_staff());
create policy companies_insert on public.companies
  for insert to authenticated with check (created_by = auth.uid());
create policy companies_update_members on public.companies
  for update to authenticated
  using (public.company_role_of(id) in ('owner', 'hr_manager') or public.is_next_admin())
  with check (public.company_role_of(id) in ('owner', 'hr_manager') or public.is_next_admin());

-- Prevent members from self-approving verification.
create or replace function public.guard_company_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.verification is distinct from old.verification
      or new.verified_at is distinct from old.verified_at)
     and not public.is_next_admin() then
    raise exception 'only NEXT admins can change verification status';
  end if;
  return new;
end $$;
create trigger companies_guard_verification before update on public.companies
  for each row execute function public.guard_company_verification();

-- company_members: members see teammates; owners manage; creator bootstraps as owner
create policy members_select on public.company_members
  for select to authenticated
  using (public.company_role_of(company_id) is not null or public.is_next_staff());
create policy members_owner_write on public.company_members
  for all to authenticated
  using (public.company_role_of(company_id) = 'owner' or public.is_next_admin())
  with check (public.company_role_of(company_id) = 'owner' or public.is_next_admin());
create policy members_bootstrap_owner on public.company_members
  for insert to authenticated
  with check (
    user_id = auth.uid() and role = 'owner'
    and exists (select 1 from public.companies c
                where c.id = company_members.company_id and c.created_by = auth.uid())
    and not exists (select 1 from public.company_members m
                    where m.company_id = company_members.company_id)
  );

-- audit_logs: admins read; writes happen only through server-side service role
create policy audit_admin_read on public.audit_logs
  for select to authenticated using (public.is_next_admin());

-- Trigger functions are internal: not callable through the public API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.guard_company_verification() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
