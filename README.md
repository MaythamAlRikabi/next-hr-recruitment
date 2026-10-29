# NEXT | HR & Recruitment — Platform

> Your next step starts here

Recruitment marketplace + employer ATS + AI CV Studio + NEXT HR agency services, for Iraq.
Official name is always **NEXT | HR & Recruitment**. NEXT Jobs / NEXT Business / NEXT AI CV Studio are internal service names only.

## Status: Phase 1 (foundation) — NOT production ready
See `docs/PHASE_1_REPORT.md`, `docs/KNOWN_LIMITATIONS.md`.

## Stack
Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, Storage, RLS) · Zod · React Hook Form.

## Run
```bash
cp .env.example .env.local   # fill Supabase URL + publishable key
npm install
npm run dev
```
Apply `supabase/migrations/*.sql` to a **dedicated NEXT Supabase project** (do not reuse other products' projects).

## Rules enforced in code
- Service-role key is server-only; browser client uses the publishable key.
- Privileged roles can never be self-assigned (RLS + trigger); company verification is admin-only.
- Private areas fail closed in `src/proxy.ts`; every query must also be covered by RLS.
- No demo data in migrations.
