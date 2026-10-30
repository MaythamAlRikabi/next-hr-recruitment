-- NEXT | HR & Recruitment — Migration 0012: phone number as an apply route for imported ads.
-- Depends on 0009/0010. STATUS: NOT applied to the real database yet (needs the owner's approval).
--
-- Rule (owner, 2026-10-31): an imported ad is valid only if it carries a way to apply written in the ad itself:
-- an apply link, an e-mail address or a phone number. "Send it to our inbox" or a bare link to the Telegram post is not enough.
-- Iraqi ads are mostly "send your CV to 07XXXXXXXXX (WhatsApp)", so the number needs its own column.
-- No external ad exists yet on the live project (checked), so the stricter constraint can be added directly.

alter table public.external_jobs
  add column apply_phone text check (apply_phone is null or apply_phone ~ '^07[3-9][0-9]{8}$');

alter table public.external_jobs drop constraint external_jobs_has_apply_route;
alter table public.external_jobs
  add constraint external_jobs_has_apply_route check (apply_url is not null or apply_email is not null or apply_phone is not null);

-- Public view gets the phone as its last column (create or replace keeps the existing grants).
create or replace view public.external_job_listings with (security_invoker = false) as
select
  e.id, e.title, e.agency, e.client_note, e.city, e.industry, e.employment_type,
  e.salary_min, e.salary_max, e.salary_currency, e.salary_note,
  e.responsibilities, e.requirements, e.apply_url, e.apply_email, e.source_label, e.source_url,
  e.language, e.posted_at, e.published_at, e.expires_at, e.apply_phone
from public.external_jobs e
where e.status = 'published' and e.expires_at > now();
