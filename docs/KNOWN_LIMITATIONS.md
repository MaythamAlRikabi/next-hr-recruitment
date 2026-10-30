# Known limitations (updated 2026-10-30)
1. Not built: profile CRUD, company profile, jobs/apply/saved/ATS UI, AI CV Studio, notifications, messaging, admin operations, storage, sitemap/robots/JobPosting data.
2. Jobs/applications schema exists only as an unapplied draft (0006).
3. Real signup/email/reset and signed-in dashboards are unverified; the sandbox cannot reach Supabase. The owner must set Supabase Auth URLs.
4. The redesign covers public pages, header/footer and login/register; candidate/employer/admin dashboards were not redesigned.
5. The redesign is on a protected preview only; production still serves the old design.
6. Logo: deployed copy is downsized raster; a high-resolution transparent original is needed.
7. Phone, email, Instagram and domain are unset by design (LinkedIn only). No admin settings UI.
8. Privacy/Terms are drafts pending legal review. No Google login.
9. AI CV Studio is blocked on an Anthropic API key and must never fabricate CV data or make hiring decisions.
10. No GitHub/CI; tests are SQL files + ad-hoc Playwright scripts; Lighthouse not run; axe is automated only; Chromium only.

## Update 2026-10-30
- Migrations 0006/0007 never run on real Supabase; Storage buckets/policies for CVs are not written.
- No jobs/apply/ATS UI, talent-pool upload UI, agency dashboard UI, CMS admin UI, AI CV Studio or AI matching (needs an Anthropic API key and design review).
- Signed-in dashboards keep the pre-redesign look; real auth flows untested (Supabase Auth URL config is still needed).
- Insights page has no articles (no fabricated content); service forms store inquiries only.
- No E2E suite, Lighthouse, CSP header or CI.
- mselect and Mindfield benchmarks could not be fetched; the gap analysis marks them unverified.
- Contact phone/email/Instagram/domain intentionally unset; logo is the supplied file, no high-res transparent version.
- Future modules (contract staffing, payroll, EOR, relocation, training) are not marketed as operational.

## Update 2026-10-30 (honest status)
- **No Staging Supabase exists.** Creating a project and a branch were both cancelled at the cost-confirmation step. None of the operational flows (register, verify e-mail, apply, CV upload, Talent Pool consent, employer posting, staff moderation, shortlists) has been executed against a real backend. Code for them is IMPLEMENTED NOT VERIFIED; the SQL behind them is tested on scratch PostgreSQL only.
- On the current Preview those pages talk to the **production** Supabase, which has only migrations 0001–0005. Forms that need 0006+ tables fail with an error message and never show success. Do not register test users or submit forms on the preview until Staging exists.
- "Anonymised" candidate visibility is enforced in the UI and shortlist view, not by the database against staff reading profiles (staff can read profiles of consenting, non-private candidates). Staff must tick the review box before submitting a shortlist.
- Contact phone/email/Instagram and domain remain unset by design. Google login is not shown (not configured).
- AI CV Studio, AI matching and CV parsing are not built (need an Anthropic API key and legal review).
- Competitor service lists for mselect/Mindfield were supplied by the owner; the sites themselves were not inspected.
