# Phase 0 + Phase 1 (partial) Report

## Done (verified)
- Next.js 16 project scaffolded; `tsc --noEmit` clean; `npm run build` passes.
- Brand: official logo files integrated unmodified; tokens, bilingual (AR/EN, RTL/LTR) layout, header, footer, homepage hero/cards/services (official copy only).
- Auth plumbing: Supabase SSR clients (publishable key only), `proxy.ts` role gate that fails closed.
- Migration `0001_foundation.sql`: enums, profiles, roles, user_roles, companies, company_members, audit_logs, helper functions, RLS, new-user trigger (always `candidate`), verification guard.
- RLS tests: 12/12 pass on scratch Postgres (`supabase/tests/rls_foundation.sql`). Two real policy bugs found and fixed during testing (creator could not see own pending company; owner-bootstrap policy was a tautology).

## Files
`src/app/{layout,page,actions}.tsx|ts`, `src/app/globals.css`, `src/proxy.ts`, `src/lib/{i18n,supabase/*}`, `src/components/{brand,layout}/*`, `supabase/migrations/0001_foundation.sql`, `supabase/tests/rls_foundation.sql`, `docs/*`, `.env.example`, `public/brand/*`.

## Not done / needs setup
See KNOWN_LIMITATIONS.md. External: dedicated Supabase project, approved logo SVG, confirm domain access, verified contact + social URLs, email provider, Anthropic API key.

## Next
Finish Phase 1 (login/register/onboarding, remaining core tables: candidates, jobs, applications, CV, agency, etc.), then Phase 2 candidate platform.
