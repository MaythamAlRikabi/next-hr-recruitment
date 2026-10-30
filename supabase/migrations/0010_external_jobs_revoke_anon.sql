-- 0010 — Supabase grants new tables to anon by default; external_jobs / job_sources must not be reachable by anon at all.
-- (RLS already returned zero rows for anon; this removes the table privilege as well. APPLIED to next-hr-recruitment on 2026-10-30.)
revoke all on public.job_sources, public.external_jobs from anon;
revoke all on public.job_sources, public.external_jobs from authenticated;
grant select, insert, update, delete on public.job_sources, public.external_jobs to authenticated;
