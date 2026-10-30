# NEXT operational update — 30 October 2026

This report supersedes older readiness statements only for the work explicitly verified below.

## Shipped
- Bilingual manual CV editor: live preview, Arabic/English document direction, JSON draft download/import, browser print-to-PDF stylesheet. No external AI provider is enabled.
- Employer signup links select the employer role. Job search retains the chosen industry.
- Password reset reports server failures; redirect validation rejects whitespace/control-character bypasses.
- Public sitemap and robots metadata.
- Existing concurrent PWA work was merged and preserved.
- Expiry moved to Postgres pg_cron at 00:30 UTC daily (03:30 Baghdad), because Vercel has no SUPABASE_SERVICE_ROLE_KEY. The job calls the existing close_expired_jobs function without exporting a credential. The obsolete Vercel expiry schedule is removed; its authenticated endpoint remains for optional manual use.
- Scheduler can close/archive expired confidential jobs without a staff session, only with an internal database/service role and without changing other job content.

## Verified
- Production build and TypeScript passed; ESLint passed; git diff checks passed.
- Six redirect-validation cases passed.
- Browser preview: Arabic editor accepts sample data and updates preview; English document headings/direction switch; draft-download feedback appears; industry remains in submitted search URL.
- Preview HTTP: sitemap, robots and PWA manifest return 200.
- Live database: all public tables have RLS enabled; resumes bucket is private with a 5 MiB limit.
- Expiry function executed successfully with zero rows changed; named cron schedule exists and is active. A future scheduled execution has not yet occurred.

## Remaining limitations
- Real account creation, email delivery, authenticated hiring cycle and CV uploads were not tested end-to-end in this session. No staging project or test identities were created.
- The browser print dialog/PDF file and JSON draft import were not end-to-end tested. Download feedback alone does not prove file contents. No mobile browser/device sweep was performed this session.
- AI writing/matching, saved-job UI and alerts remain incomplete. External ingestion still needs a server credential and configured sources; it was not enabled by this update.
- Existing database advisories remain: four intentionally filtered SECURITY DEFINER views, consent RPC, leaked-password protection setting, plus performance advisories. RLS being enabled is not proof of full cross-role isolation. Review views and policies with representative role tests before claiming complete production readiness.
- Privacy/terms remain drafts. No claim of full platform readiness is made.
