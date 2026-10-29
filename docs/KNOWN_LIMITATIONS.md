# Known Limitations (Phase 1)

1. **Not deployed, no live database.** The migration was validated only on a scratch local PostgreSQL 16 with a stub `auth` schema. It has not run on a real Supabase project; Supabase Auth, email verification, and Storage are unverified. A dedicated NEXT Supabase project has not been created (cost/ownership needs approval; the existing projects in the connected account belong to other products and were not touched).
2. **Existing website `nextrecruitment.work.gd` could not be inspected** from this environment (outbound fetch blocked). Domain/DNS/HTTPS/ownership checks are pending. Nothing replaces or touches the live site.
3. **Logo is raster-only** (supplied PNGs). Approved SVG requested; favicon uses the PNG mark.
4. **Colors are provisional.**
5. **Only foundation exists:** homepage, header/footer, locale switch, auth gate (`proxy.ts`), foundation schema (profiles, roles, companies, members, audit log). Login/register pages, jobs, applications, CV Studio, agency, admin, notifications, AI adapter, SEO and the remaining ~50 routes are **not built yet**. Homepage links to routes that do not exist yet (/jobs, /employers, etc.) return 404 until their phase.
6. Homepage search submits to `/jobs`, which does not exist yet.
7. No automated test runner is wired up yet; RLS tests are plain SQL in `supabase/tests/`.
8. Legal pages, email delivery, OTP/SMS, payments: not started.
