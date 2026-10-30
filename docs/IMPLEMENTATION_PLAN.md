# Implementation plan and status

Labels: DONE & TESTED / IMPLEMENTED NOT VERIFIED / BLOCKED / NOT STARTED.

| Phase | Scope | Status |
|---|---|---|
| A | Recovery: public routes, P0 prerender fix, headers, error pages | DONE & TESTED locally; was on production at last deploy (not re-verified here) |
| B | Auth: register/login/reset, callbacks, role gate, account deletion request | IMPLEMENTED NOT VERIFIED end to end (sandbox cannot reach Supabase; Auth URL config pending) |
| UI | Premium redesign: tokens, header/footer, homepage, jobs search, auth screens | DONE & TESTED locally and built on a Vercel preview. Latest contrast fixes not yet on the preview |
| C1 | Jobs, saved jobs, applications, pipeline history, employer notes: migration 0006 + RLS | IMPLEMENTED NOT VERIFIED on Supabase. 32/32 scratch-DB tests pass. NOT applied to production (needs release approval) |
| C2 | Jobs UI: listing from DB, detail page, apply, saved jobs, employer vacancy form, ATS board, candidate dashboard | NOT STARTED (depends on C1 approval) |
| C3 | Candidate profile, company profile, document storage with private bucket | NOT STARTED |
| D | AI CV Studio: upload, parse, analyse, tailor, export PDF/DOCX with user approval | BLOCKED: needs an Anthropic API key. Never invents facts, never decides hiring |
| E | Agency workflow, admin dashboard, notifications, messaging | NOT STARTED |
| F | SEO (sitemap, robots, JobPosting data), CSP, CI, committed Playwright suite | NOT STARTED |

## Release rules
Preview first, smoke test, then promotion only after explicit approval. Production DB migrations only after explicit approval. First Super Admin only by a controlled setup, never self-registration.
