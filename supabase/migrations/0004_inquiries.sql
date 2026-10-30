-- NEXT | HR & Recruitment — Migration 0004: public inquiries
-- One intake table for the public forms: contact, recruitment-service requests,
-- career-consulting requests and abuse reports. Each row gets a reference number.
-- Anonymous visitors may INSERT only (no read-back); NEXT staff manage them.

create type public.inquiry_kind as enum
  ('contact', 'recruitment_service', 'career_consulting', 'abuse_report');
create type public.inquiry_status as enum ('new', 'in_progress', 'closed');

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check (reference ~ '^NX-[0-9]{8}-[A-Z0-9]{6}$'),
  kind public.inquiry_kind not null,
  status public.inquiry_status not null default 'new',
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$'),
  company_name text check (company_name is null or char_length(company_name) <= 160),
  subject text check (subject is null or char_length(subject) <= 200),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object' and pg_column_size(details) <= 8192),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  privacy_consent boolean not null check (privacy_consent),
  submitted_by uuid references auth.users(id) on delete set null default auth.uid(),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_kind_status_idx on public.inquiries(kind, status, created_at desc);
create index inquiries_email_idx on public.inquiries(lower(email), created_at desc);
create index inquiries_submitted_by_idx on public.inquiries(submitted_by);
create index inquiries_assigned_to_idx on public.inquiries(assigned_to);

create trigger inquiries_updated before update on public.inquiries
  for each row execute function public.set_updated_at();

-- Abuse guard: at most 5 submissions per e-mail per hour. SECURITY DEFINER because
-- the submitter has no SELECT access to the table.
create or replace function public.inquiries_rate_limit()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.inquiries
      where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too many submissions, try again later' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger inquiries_rate_limit before insert on public.inquiries
  for each row execute function public.inquiries_rate_limit();
revoke execute on function public.inquiries_rate_limit() from public, anon, authenticated;

alter table public.inquiries enable row level security;

-- Table privileges: anonymous = insert only. Everything else is gated by RLS.
revoke all on public.inquiries from anon, authenticated;
grant insert on public.inquiries to anon, authenticated;
grant select, update on public.inquiries to authenticated;

create policy inquiries_public_insert on public.inquiries
  for insert to anon, authenticated
  with check (
    status = 'new' and assigned_to is null
    and (submitted_by is null or submitted_by = auth.uid())
  );
create policy inquiries_select on public.inquiries
  for select to authenticated
  using (submitted_by = auth.uid() or private.is_next_staff());
create policy inquiries_staff_update on public.inquiries
  for update to authenticated
  using (private.is_next_staff()) with check (private.is_next_staff());
