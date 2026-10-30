-- NEXT | HR & Recruitment — Migration 0013: no Telegram links or handles on imported ads.
-- STATUS: applied to the real database on 2026-10-31 with the owner's approval.
--
-- Rule (owner, 2026-10-31): published ads never show Telegram links (t.me/…) or Telegram handles (@name).
-- New ads are cleaned by the importer / staff forms (src/lib/ingest/telegram.ts). This migration cleans the ads already stored
-- and stops the public view from exposing a Telegram post link. `raw_text` is left as originally posted (staff-only, used for de-duplication).

create or replace function private.strip_telegram(t text) returns text
language sql immutable set search_path = '' as $$
  select nullif(btrim(
    regexp_replace(
      regexp_replace(
        t,
        '((تلغرام|تليغرام|تيليجرام|تليجرام|telegram|tg)[[:space:]]*[:：–-]?[[:space:]]*)?((https?://)?(www\.)?(t\.me|telegram\.me|telegram\.dog)/[^[:space:])]*)',
        '', 'gi'),
      '((تلغرام|تليغرام|تيليجرام|تليجرام|telegram|tg)[[:space:]]*[:：–-]?[[:space:]]*)?(^|[[:space:]({،,؛])@[A-Za-z][A-Za-z0-9_]{3,31}',
      '\3', 'gi')
  ), '')
$$;

update public.external_jobs e set
  title          = coalesce(private.strip_telegram(e.title), e.title),
  agency         = private.strip_telegram(e.agency),
  client_note    = private.strip_telegram(e.client_note),
  salary_note    = private.strip_telegram(e.salary_note),
  responsibilities = coalesce(array(select s from (select private.strip_telegram(x) s from unnest(e.responsibilities) x) q where s is not null), '{}'),
  requirements     = coalesce(array(select s from (select private.strip_telegram(x) s from unnest(e.requirements) x) q where s is not null), '{}'),
  apply_url      = case when e.apply_url ~* '^https?://(www\.)?(t\.me|telegram\.me|telegram\.dog)/' and (e.apply_email is not null or e.apply_phone is not null) then null else e.apply_url end,
  source_label   = coalesce(nullif(btrim(regexp_replace(e.source_label, '[[:space:]]*\([[:space:]]*@?[A-Za-z0-9_]{4,32}[[:space:]]*\)[[:space:]]*$', '')), ''), e.source_label);

update public.job_sources set name = coalesce(nullif(btrim(regexp_replace(name, '[[:space:]]*\([[:space:]]*@?[A-Za-z0-9_]{4,32}[[:space:]]*\)[[:space:]]*$', '')), ''), name);

drop function private.strip_telegram(text);

-- Public view: same columns, but a Telegram post link is never exposed.
create or replace view public.external_job_listings with (security_invoker = false) as
select
  e.id, e.title, e.agency, e.client_note, e.city, e.industry, e.employment_type,
  e.salary_min, e.salary_max, e.salary_currency, e.salary_note,
  e.responsibilities, e.requirements, e.apply_url, e.apply_email, e.source_label,
  case when e.source_url ~* '^https?://(www\.)?(t\.me|telegram\.me|telegram\.dog)/' then null else e.source_url end as source_url,
  e.language, e.posted_at, e.published_at, e.expires_at, e.apply_phone
from public.external_jobs e
where e.status = 'published' and e.expires_at > now();
