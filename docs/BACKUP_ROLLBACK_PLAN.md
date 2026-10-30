# Backup & Rollback Plan — migrations 0006/0007 (and 0008)

Status: **PLAN + ROLLBACK SCRIPT TESTED ON SCRATCH.** Nothing has been run against production.

## Before release (owner approval required)
1. Confirm Staging passed: migrations applied, `get_advisors` clean or accepted, RLS suites green, E2E green.
2. Backup production: Supabase Dashboard → Database → Backups (or `pg_dump` of the `public` schema). Production currently holds **0 rows** in every table, so the dump is small; still keep it.
3. Record current migration list (`0001`–`0005`) and Vercel production deployment `dpl_5oZuTg4LyBFZQBdFY77zgszU7twR` (rollback candidate).
4. Freeze: no manual schema edits in the dashboard during the window.

## Release order
1. Apply the squashed release migration (0006+0007+0008) in **one transaction** to production.
2. Run the read-only checks: table/policy counts (63 policies, 24 tables + 2 views expected), `get_advisors`.
3. Only then promote the Vercel preview (the app expects the new tables). If step 2 fails, do not promote.

## Rollback
* **App:** promote/rollback to `dpl_5oZuTg4LyBFZQBdFY77zgszU7twR` (Vercel rollback). The old app does not use the new tables.
* **Database:** run `supabase/rollback/0006_0007_down.sql`. It drops every object added by 0006/0007 and restores the policy set of 0005.
  Verified on scratch: after the script, the fingerprints of columns, constraints, indexes, policies, RLS flags, triggers, functions and enums are byte-identical to the 0005 baseline.
* **Data caveat:** the down script **destroys data** in the new tables. Once real users exist, restore from backup / export the new tables first instead of running it blindly.
* Storage: remove the `resumes` bucket only after exporting files (`0008_down` in the same folder).
