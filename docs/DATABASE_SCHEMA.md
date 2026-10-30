# Database schema
## Applied live (migrations 0001–0005) — DONE & TESTED on scratch + advisors
Enums: `app_role`, `company_role`, `verification_status`, `inquiry_kind`, `inquiry_status`, `deletion_status`.
Tables (RLS on): `profiles`, `roles`, `user_roles`, `companies`, `company_members`, `audit_logs`, `inquiries`, `account_deletion_requests`.
Functions: `private.is_next_staff/is_next_admin/has_role/company_role_of`; new-user trigger (always `candidate`; `employer` added when purpose=employer; staff roles never from client metadata); verification guard; inquiry rate-limit trigger.

## Draft — `supabase/migrations/0006_jobs_applications.sql` — NOT APPLIED
Enums `job_status`, `employment_type`, `work_mode`, `application_status`.
Tables `jobs`, `saved_jobs`, `applications` (unique job+candidate), `application_events`, `application_notes`.
Trigger functions `guard_job_write`, `guard_application_write`, `log_application_created` (execute revoked from clients). Column-level grant: candidates/members may update `applications.status` only. `anon` can read published jobs only.
Tested: 32/32 on scratch PostgreSQL. **Requires explicit release approval before applying to production.**

## Not created yet
candidate profile detail tables, resumes/CV, notifications, messaging, settings, storage buckets.
Rollback: migrations are additive; drop in reverse order only with an approved plan.

## Migration 0007 — `0007_talent_pool_agency_cms.sql` (DRAFT, not applied; depends on 0006)

New enums: `recruitment_method`, `resume_visibility`, `request_status`, `shortlist_status`, `disclosure_level`, `item_consent`, `interview_mode`, `interview_status`, `article_status`, `alert_frequency`.
Altered: `jobs` (+`recruitment_method`, `hide_employer`, `seniority`; constraint executive ⇒ hidden employer); `guard_job_write()` redefined; `jobs_public_read` narrowed; 0006 applications/notes/profile policies replaced with `private.can_manage_direct_job()`; `applications_candidate_insert` now uses definer helper `private.job_accepts_applications()`.
New tables: `talent_pool_consents` (append-only), `candidate_profiles`, `resumes` (metadata only), `recruitment_requests`, `agency_assignments`, `shortlists`, `shortlist_items`, `interviews`, `interview_feedback`, `job_alerts`, `articles`.
Views: `job_listings` (public, employer optionally hidden), `client_shortlist_view` (the only way a client sees candidates).
Audit: `private.audit()` writes `audit_logs` on consent, request transitions, assignment, shortlist submission, article publication.
Not included: Storage bucket/policies, background parsing queue, notification delivery, seed data.

## Update 2026-10-30
- **0007 (draft, edited):** candidate policies on `shortlist_items` removed; added view `public.my_consent_requests` and function `public.respond_shortlist_consent(uuid, boolean)`; `recruiter_note` is no longer candidate-readable.
- **0008 (draft, new):** `supabase/migrations/0008_storage_resumes.sql` — private bucket `resumes` (5,242,880 bytes; PDF/DOCX), policies `resumes_obj_insert_own`, `resumes_obj_select_own`, `resumes_obj_delete_own` (first path segment = `auth.uid()`), `resumes_obj_select_staff`. No UPDATE policy.
- Rollback scripts: `supabase/rollback/0006_0007_down.sql` (verified on scratch) and `0008_down.sql`.
- See `SCHEMA_DIFF.md` for the before/after fingerprint. Production still equals 0001–0005; **0006/0007/0008 are NOT applied** (owner has not approved).
