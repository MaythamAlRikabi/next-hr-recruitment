# Migration Review — 0006 / 0007 / 0008

Status: **REVIEWED, TESTED ON SCRATCH POSTGRESQL 16, NOT APPLIED ANYWHERE REAL.**
Detail lives in `SCHEMA_DIFF.md` (line-by-line findings), `BACKUP_ROLLBACK_PLAN.md`, `RLS_TEST_REPORT.md`.

| Migration | Lines | Content | Scratch tests | Rollback | Applied |
|-----------|-------|---------|---------------|----------|---------|
| 0006_jobs_applications | 289 | jobs, applications, events, notes, candidate_profiles, `job_listings` view | 32/32 | supabase/rollback/0006_0007_down.sql | No |
| 0007_talent_pool_agency_cms | 787 | talent pool consent, managed recruitment, shortlists, interviews, CMS articles, alerts, saved jobs; rewrites some 0006 policies | 78/78 | same | No |
| 0008_storage_resumes | 42 | private `resumes` bucket (5 MB, PDF/DOCX), own-folder policies, staff read only for consenting+searchable candidates | 11/11 | supabase/rollback/0008_down.sql | No |

## Open items before any real application
1. Build `0006_0007_release.sql` (single transaction) — avoids the intermediate state where an employer could read applicants of a managed job. **NOT DONE.**
2. Decide on owner-run views (advisor lint 0010) — accept + document, or convert to RPCs. **Undecided.**
3. Staff "anonymisation reviewed" checkbox before submitting a shortlist (UI). **NOT BUILT.**
4. Run on an **independent Staging** project: Schema Diff against Staging, advisors (`get_advisors`), real PostgREST JWT behaviour, real Storage policies. **BLOCKED** — Staging does not exist.
5. Backup of Production before apply: production has 0 rows in all tables (verified read-only), so data risk is nil today; the plan still requires a dump.

## What was NOT changed this session
No migration was applied to project `vaetlahxfsaiccujmivy`. No branch or project was created. Production deployment unchanged.
