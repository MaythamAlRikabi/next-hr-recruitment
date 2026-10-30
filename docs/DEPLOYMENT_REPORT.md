# Deployment report (2026-10-30)

| Item | State |
|---|---|
| Vercel project | `next-hr-recruitment` (prj_loDWubdA38S7Iy3J3UcHLQJNJpiC), preserved |
| Production alias | https://next-hr-recruitment.vercel.app → `dpl_5oZuTg4LyBFZQBdFY77zgszU7twR` = **Phase A+B, OLD design**. Not promoted. |
| Preview of the redesign | `dpl_4UZzhYpKKMvAXMGHhjJQU7tdetAg` — state READY, includes the contrast/underline fixes. Protected by Vercel login. |
| Earlier preview | `dpl_9D1PrFYKt2pkKHDM1JVr7jqRiFu8` — READY, superseded (lacks the fixes). |
| Supabase | live migrations 0001–0005; **0006 (jobs/applications) NOT applied** |
| Domain / `nextrecruitment.work.gd` | untouched; no domain purchased |

## Verification of the new preview
- Build READY (≈21 s).
- Fetched `/login` (HTTP 200, `lang="ar" dir="rtl"`): underlined-link classes present.
- Fetched `/` (HTTP 200): `violet-ink` token present, Arabic hero title and empty-jobs state rendered.
- `get_runtime_errors`: the two groups returned (`new Date()` prerender on `/` and `/_not-found`) have last deployment `dpl_AAcbn…` (an older deployment) and last seen 2026-10-29 19:56 UTC; none are attributed to the new preview. IMPLEMENTED, NOT VERIFIED under real traffic.

## How the deployment is made (lessons)
Deployments are created through the Vercel API with file lists (no Git). `missing_files` (HTTP 400) means a referenced SHA is not in Vercel's file store; it does not name the file.
- A SHA reference only works if that exact content was inlined in, or deployed by, an earlier successful deployment. A failed create stores nothing.
- Inline copies that differ by even one byte from disk produce a different SHA; compare against `list_deployment_files` (it truncates at depth; the top-level `uid`s are reliable).
- `src/content/home.ts` on disk differed from the version stored by the earlier deployment, which caused one 400. Fix: inline changed files, reference only unchanged ones.
- Files never deployed before (inline them or leave out): `.gitignore`, `README.md`, `eslint.config.mjs`, `src/app/favicon.ico`, `public/*.svg`.
- Logo PNGs use the previously deployed SHAs (`bfb97387…`, `114cc78a…`), which differ from the local originals.

## Rollback
Production is unchanged. Rolling back a future promotion = re-promote `dpl_5oZuTg4LyBFZQBdFY77zgszU7twR`. Migration 0006 is additive; rollback = drop its tables/enums/functions in reverse order, only under an approved plan.

## Update — expansion preview (2026-10-30)

| Item | Value |
|---|---|
| Preview deployment | `dpl_ER7WuhDoqEq6ytZ89RhGwy2jaYsR` — state READY (preview target; no alias; **not production**) |
| Contents | Nav/IA expansion (8 links + mobile quick actions), `/executive-search`, `/insights`, `/submit-cv`, `/services/[slug]` (6 pages), 13-section-style homepage |
| Production | Unchanged: still `dpl_5oZuTg4LyBFZQBdFY77zgszU7twR` (Phase A+B). **Nothing promoted.** |
| Database | Migrations 0001–0005 applied; **0006 and 0007 are drafts, not applied.** |
| Smoke check | HTTP 200 and expected Arabic copy present on `/`, `/executive-search`, `/services/talent-mapping`, `/submit-cv`, `/insights`; `get_runtime_errors` (1h) = none |
| Not verified on the preview | English locale, mobile viewport, axe — these were verified on the identical local build only |

Failed attempts (recorded for honesty): `dpl_DPC21u…` cancelled by me (payload omitted two files); `dpl_7LFQAU…` ERROR (payload omitted `src/lib/supabase/*`). Both were previews and are not aliased. Cause: hand-built file manifest; lesson — build the manifest from a full directory walk and diff it against the previous deployment before sending.

Status: **IMPLEMENTED NOT VERIFIED (preview only)**. A READY build is not a launch-readiness signal.
