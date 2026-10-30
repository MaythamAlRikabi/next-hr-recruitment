# Architecture
- **Framework:** Next.js 16.4 App Router, React 19, Tailwind 4, Zod 4. `cacheComponents` on; time values via `"use cache"`.
- **Rendering:** all routes dynamic (locale cookie); shared layout reads locale; Header auth state streamed via `<Suspense>`.
- **Auth:** Supabase Auth through `@supabase/ssr` with the publishable key only. PKCE callback `/auth/callback`, token-hash `/auth/confirm`. `proxy.ts` refreshes the session (`getClaims`) and gates `/candidate /employer /agency /admin` by role and `/account` by sign-in; pages re-check via `requireRole` (`getUser`); RLS is the final authority.
- **Authorization model:** `app_role` enum (candidate, employer, next_recruiter, next_admin, super_admin) in `user_roles`; company-scoped roles in `company_members`; SECURITY DEFINER helpers in the non-exposed `private` schema.
- **Forms:** server actions with Zod validation, generic anti-enumeration responses, honeypot + DB-level rate limit on inquiries, `safeNext` open-redirect guard.
- **i18n:** `src/lib/i18n.ts` + `src/content/*` (AR/EN). No service-role key anywhere in the app.
- **Hosting:** Vercel project `next-hr-recruitment`; DB: Supabase project `vaetlahxfsaiccujmivy`.
