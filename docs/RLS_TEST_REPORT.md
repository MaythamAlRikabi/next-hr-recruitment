# RLS test report (updated 2026-10-30)
Method: SQL state tests on a scratch PostgreSQL 16 with a stub `auth` schema (fresh DB per file; set role `authenticated` and `request.jwt.sub`), plus earlier rollback-only checks on live Supabase.
| File | Result | Applies to |
|---|---|---|
| rls_foundation.sql | 12/12 PASS | live schema (0001–0005) |
| rls_inquiries.sql | 10/10 PASS | live schema |
| rls_auth_accounts.sql | 10/10 PASS | live schema |
| rls_jobs.sql (J1–J32) | 32/32 PASS | **draft 0006 only — scratch DB, not live** |
| **Total** | **64/64** | |

Note: running a file twice on the same DB gives false FAILs (duplicate fixtures); always use a fresh DB. Printed ERROR lines are the intentionally denied attempts.
What J1–J32 cover: public sees only published jobs; company members see/write only their own company's jobs; candidates see only their own applications and can apply once per job; a candidate cannot change status/other columns; staff and company members can move status only; notes visible to company side only; guard triggers block field tampering.
Not tested: the 0006 policies on real Supabase (not applied), storage policies (no buckets yet), performance under load.

## Update — migration 0007 (draft) on scratch PostgreSQL 16

`supabase/tests/rls_agency.sql`: **78/78 PASS** on a fresh database with 0001–0007 applied (`test_results7`).
`supabase/tests/rls_jobs.sql` re-run on top of 0007: **32/32 PASS** (no regression).

Covered: public job surface (`job_listings` hides executive roles and hidden employers; salary only if `show_salary`); employers cannot create managed/hidden jobs or flip a job to managed; applications and applicant profiles of managed jobs are invisible to the client company; talent-pool consent (cannot become searchable without consent, withdrawal resets visibility and removes staff access, append-only history, no re-enable after withdrawal); resume constraints (mime, own path, size); company isolation for recruitment requests; admin-only assignment; state-machine enforcement; shortlist (full disclosure needs candidate consent, staff cannot grant consent, submitted shortlist immutable, client sees only `client_shortlist_view`, revocation removes a candidate at once); interviews and internal feedback; alerts (own only, max 10); CMS (staff draft, admin publish, anon sees published only); audit rows written and not forgeable.

Limits: scratch DB with a stubbed `auth` schema — **not** a real Supabase project. Storage bucket policies for CV files are not covered. Status: **IMPLEMENTED, TESTED ON SCRATCH ONLY; NOT APPLIED**.

## Update 2026-10-30 (second round, scratch PostgreSQL only)
- **Finding fixed in draft 0007:** `shortlist_items.recruiter_note` was readable by candidates through a candidate SELECT/UPDATE policy. Candidates now have **no direct access** to `shortlist_items`; they see their own requests through `public.my_consent_requests` and answer through `public.respond_shortlist_consent(item, grant)` (security definer, authenticated only).
- `rls_agency.sql`: **78/78 PASS** after the change (K47/K48/K50/K58 rewritten for the function path). `rls_jobs.sql`: **32/32 PASS**.
- New `supabase/tests/rls_storage.sql` for migration 0008 (private `resumes` bucket, 5 MB, PDF/DOCX): **S1–S11 11/11 PASS** against a *stub* `storage` schema (own-folder insert/select/delete; no cross-user access; staff read only for consenting + searchable candidates; companies have no policy; no UPDATE policy).
- Still NOT tested on a real Supabase project (no Staging exists): real `storage.objects` behaviour, real Auth, PostgREST error mapping, advisors.
