-- NEXT | HR & Recruitment — Migration 0014: no channel signature / watermark lines on imported ads.
-- STATUS: applied to the real database on 2026-10-31 on the owner's explicit request.
--
-- Rule (owner, 2026-10-31): the line "▓▓▓▓▓˹𝐌𝗙˼▒▒▒▒▒▒▒▒ @Medical_Field #علي_احمد_الجنابي" (and any decoration made of block characters)
-- is removed from every ad — published, pending and future. New ads are cleaned by the importer / staff forms
-- (src/lib/ingest/signature.ts). This migration cleans the ads already stored. `raw_text` is left as originally posted
-- (staff-only, used for de-duplication; the staff view hides the signature).

create or replace function private.strip_signature(t text) returns text
language sql immutable set search_path = '' as $$
  select nullif(btrim(
    regexp_replace(
      regexp_replace(t, '[▀-▟]{3,}[^\n]*', '', 'g'),
      '#?علي[_[:space:]]+احمد[_[:space:]]+الجنابي', '', 'g')
  ), '')
$$;

update public.external_jobs e set
  title            = coalesce(private.strip_signature(e.title), e.title),
  agency           = private.strip_signature(e.agency),
  client_note      = private.strip_signature(e.client_note),
  salary_note      = private.strip_signature(e.salary_note),
  responsibilities = coalesce(array(select s from (select private.strip_signature(x) s from unnest(e.responsibilities) x) q where s is not null), '{}'),
  requirements     = coalesce(array(select s from (select private.strip_signature(x) s from unnest(e.requirements) x) q where s is not null), '{}')
where concat_ws(' ', e.title, e.agency, e.client_note, e.salary_note, array_to_string(e.responsibilities, ' '), array_to_string(e.requirements, ' ')) ~ '[▀-▟]{3,}|علي[_[:space:]]+احمد[_[:space:]]+الجنابي';

drop function private.strip_signature(text);
