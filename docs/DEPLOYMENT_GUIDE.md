# Deployment guide
1. Env (Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://next-hr-recruitment.vercel.app`.
2. Supabase → Authentication → URL Configuration: Site URL = the production URL; add redirect URLs `https://next-hr-recruitment.vercel.app/auth/callback` and `/auth/confirm`. Without this, confirmation/reset links point to localhost.
3. Open confirmation/reset links in the same browser that requested them (PKCE).
4. Apply migrations in order (0001→0005) — already applied on project `vaetlahxfsaiccujmivy`.
5. Recommended: connect the project to a GitHub repo, use a dev branch + Preview deployments + CI (tsc, lint, build, Playwright).
