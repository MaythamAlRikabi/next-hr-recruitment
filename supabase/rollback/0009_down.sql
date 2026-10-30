drop view if exists public.external_job_listings;
drop table if exists public.external_jobs;
drop table if exists public.job_sources;
drop function if exists public.guard_external_job_write();
drop type if exists public.external_job_status;
drop type if exists public.job_source_kind;
