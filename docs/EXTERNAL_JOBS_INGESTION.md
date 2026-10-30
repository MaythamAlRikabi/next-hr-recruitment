# External jobs: sources, limits and how it works

**Status:** implemented on branch `next-3.1-dev`, tested on fixtures and on a scratch Postgres. Migration `0009` is **not applied to any real database**. No live source has been contacted from the build environment.

## What a candidate sees
`/jobs/external` – each listing shows its **source**, the client note exactly as written ("لأحد عملاء شركة … "), city, salary text, tasks, requirements, and a button **"Apply on the original post"** that opens the original link. NEXT never claims the vacancy as its own and never processes the application.

## Sources
| Source | How | Allowed? | Status |
|---|---|---|---|
| Staff paste (any platform: LinkedIn, Facebook, Instagram, Telegram, e-mail, WhatsApp) | recruiter pastes the post in `/agency/external-jobs`; the parser fills the fields; a recruiter publishes | Yes – a person reads and posts it | **Works** (needs backend) |
| Telegram channel | `t.me/s/<channel>` public preview, daily | Only channels whose owner agreed (recorded in `basis`). Telegram's terms discourage bulk scraping, so keep this to partners | Implemented, fixture-tested |
| RSS / Atom feed | daily | Yes if the publisher offers it | Implemented, fixture-tested |
| Career pages with `JobPosting` JSON-LD | daily | Yes – meant to be read by job aggregators; respect robots.txt/terms | Implemented, fixture-tested |
| LinkedIn, Facebook, Instagram | automatic collection | **No.** Their terms forbid scraping and their APIs do not give a general job-post feed. Use the paste form, an official partner programme (e.g. LinkedIn Talent/Job Posting partnerships), or ask the company to send a feed | Not built, deliberately |
| Recruitment platforms (e.g. Indeed, Bayt, local boards) | their partner/affiliate feed or XML | Needs a written agreement with each | Not built – tell us which ones and we add the feed |

## Safety rules built in
* Every imported row starts as `pending_review`. The importer role **cannot** publish (database trigger, tested).
* Public pages read a view that never exposes the raw text, hashes or reviewer.
* De-duplication by text hash and by source + post id. Listings expire after 45 days.
* Only `https` sources, no redirects, no internal hosts, 15 s timeout, 2 MB cap, 30 posts per source per run.
* Parser is deterministic (no AI guesses); anything uncertain becomes a warning shown to the reviewer; a post with no title or no way to apply is skipped.

## Switching the daily import on (when you approve)
1. Apply `supabase/migrations/0009_external_jobs.sql` to **Staging first**, run `supabase/tests/rls_external_jobs.sql` (27 checks passed on scratch Postgres), then to Production only with your explicit approval. Rollback: `supabase/rollback/0009_down.sql`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` (server only) and `CRON_SECRET` in Vercel. Without them the cron route returns 503 and nothing runs.
3. `vercel.json` schedules `/api/cron/ingest` daily at 04:00 UTC (07:00 Baghdad). Vercel runs crons on **Production deployments only**; on Preview use the paste form.
4. An admin adds sources in `/agency/external-jobs` with a written reason for each.

## Tests
`node --experimental-strip-types --test src/lib/ingest/*.test.ts` (10 pass) · `supabase/tests/rls_external_jobs.sql` · Playwright `external jobs page`.
