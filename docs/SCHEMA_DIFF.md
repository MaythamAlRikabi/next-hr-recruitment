# Schema Diff — production (after 0005) → after 0006 + 0007

Status: **REVIEWED, NOT APPLIED.** Method: the real production schema (project `vaetlahxfsaiccujmivy`, read-only queries) was fingerprinted
(columns, constraints, indexes, policies, RLS flags, triggers, enums, functions) and compared with a scratch PostgreSQL built from
migrations 0001–0005. All fingerprints match; the only difference is whitespace in three helper functions
(`private.has_role/is_next_admin/is_next_staff`), which are semantically identical. Then 0006+0007 were applied to a second scratch DB and
`pg_dump -s` of both were compared.

## Production data at review time
`auth.users` 0 · `profiles` 0 · `user_roles` 0 · `companies` 0 · `inquiries` 0 · `audit_logs` 0 → no existing row can conflict with the new constraints.

## Summary of change
| | Before (0005) | After (0007) |
|---|---|---|
| Tables (public) | 8 | 24 (+16 tables) + 2 views |
| RLS policies | 19 | 63 |
| Triggers | 5 | 21 |
| App functions (public+private) | 8 | 28 |
| Enum types | 6 | 20 (+14) |
| Removed / altered existing objects | — | **none removed**; one new policy on `public.profiles` (`profiles_select_applicants`) |

New tables: agency_assignments, application_events, application_notes, applications, articles, candidate_profiles, interview_feedback, interviews, job_alerts, jobs, recruitment_requests, resumes, saved_jobs, shortlist_items, shortlists, talent_pool_consents.
New views: `job_listings`, `client_shortlist_view` (both `security_invoker = false` by design; see findings).
New functions: private.audit(_action text, _entity text, _id text, _details jsonb), private.can_manage_direct_job(_job uuid), private.can_manage_interview(_interview uuid), private.can_see_interview(_interview uuid), private.can_staff_shortlist(_shortlist uuid), private.company_of_shortlist(_shortlist uuid), private.has_active_pool_consent(_user uuid), private.is_request_staff(_request uuid), private.job_accepts_applications(_job uuid), public.guard_application_write(), public.guard_article(), public.guard_assignment(), public.guard_candidate_profile(), public.guard_job_alert(), public.guard_job_write(), public.guard_request_write(), public.guard_shortlist(), public.guard_shortlist_item(), public.log_application_created(), public.on_pool_consent().

## Line-by-line review findings
1. **0007 rewrites policies created by 0006** (`jobs_public_read`, `applications_*`, `notes_*`, `profiles_select_applicants`). They never existed in production, so the fix is to **apply 0006+0007 as one transaction** (squash) so that the intermediate 0006-only state — where an employer could read applicant data of a managed job — is never live. *Action: build `0006_0007_release.sql` before release.*
2. **Owner-run views** (`security_invoker=false`) will be flagged by the Supabase security advisor (lint 0010). Intentional: they are the only way to hide employer identity / anonymise candidates. They expose only whitelisted columns, filter inside the view, and are granted to specific roles only. Accept and document, or replace by `security definer` RPCs.
3. **Anonymised preview leaks via free text**: `candidate_profiles.summary` is written by the candidate and is shown in `client_shortlist_view` before consent. A candidate could type their name/employer. Mitigation already in the flow: only NEXT staff can submit a shortlist; add a mandatory staff "anonymisation reviewed" checkbox in the agency UI (not built yet).
4. **No Storage objects in 0007**: CV bucket and `storage.objects` policies are missing → upload cannot be real yet. New draft `0008_storage_resumes.sql` (see below) covers it.
5. All 23 `SECURITY DEFINER` functions set `search_path`, live in `private` (not exposed through the Data API) or are trigger functions with `EXECUTE` revoked from `public/anon/authenticated`.
6. Grants are column-scoped where needed (`applications.status` only; `recruitment_requests.status` only). Tables have RLS enabled and `FORCE` is not used (service role is not used by the app).
7. Triggers enforce state machines (request status, shortlist immutability after submit, consent append-only) so the UI cannot be the only guard.

## Not yet verified
Behaviour on a real Supabase instance (Auth hooks, `auth.uid()` from PostgREST JWT, Storage, advisors). Requires the Staging project.
