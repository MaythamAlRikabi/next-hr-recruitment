# NEXT 3.0 — Feature Gap Analysis

Status vocabulary: **DONE & TESTED** · **IMPLEMENTED NOT VERIFIED** · **BLOCKED** · **NOT STARTED**.
"Tested" means exercised in a browser or test runner in this session. Nothing below that touches the real database was run against production.

| Area | Feature | Status | Note |
|------|---------|--------|------|
| Design | V3 tokens, fonts, type scale | DONE & TESTED | axe 0 violations / 44 loads; no overflow at 360–1440 |
| Design | Midnight homepage (all 14 brief sections; Industry and Location share one section) | DONE & TESTED | see SITEMAP_V3 for section mapping |
| Design | Mega menu + grouped mobile nav | DONE & TESTED | click/hover/Esc/outside-click; no overflow at 1280 AR/EN |
| Design | KPI cards, progress, step list, empty/error/skeleton | IMPLEMENTED NOT VERIFIED | used in auth-gated dashboards; EmptyState verified on public pages only |
| Design | Notification center, toasts, dialogs, kanban, data-table component | NOT STARTED | |
| Public | Latest jobs (DB-backed) | IMPLEMENTED NOT VERIFIED | empty/error fallback tested; with data needs migration 0006 |
| Public | Verified companies (approved only, RLS) | IMPLEMENTED NOT VERIFIED | empty state tested |
| Public | Jobs search/filter/pagination | IMPLEMENTED NOT VERIFIED | needs `job_listings` view |
| Public | Job details page | IMPLEMENTED NOT VERIFIED | no rows to render |
| Public | Executive Search, Services, About, Contact, FAQ, legal drafts | DONE & TESTED | public pages |
| Public | Career Insights CMS | IMPLEMENTED NOT VERIFIED | schema in 0007; UI shows honest empty state |
| Auth | Register / login / verify / reset | IMPLEMENTED NOT VERIFIED | needs Site URL config + a test project |
| Candidate | Profile, CV upload (private bucket, 5 MB PDF/DOCX) | IMPLEMENTED NOT VERIFIED | needs 0008 |
| Candidate | Applications + withdrawal, consent requests, Talent Pool opt-in | IMPLEMENTED NOT VERIFIED | needs 0006/0007 |
| Candidate | Saved jobs, job alerts, interview preparation | NOT STARTED | shown disabled with a "not available yet" badge; alert tables are in 0007 draft |
| Employer | Company registration, job wizard (draft → review → publish), applicants list, recruitment request | IMPLEMENTED NOT VERIFIED | autosave not built; kanban not built |
| Employer | Company "Verified" | IMPLEMENTED NOT VERIFIED | only admin can change verification (DB trigger tested on scratch PG) |
| Agency | Inquiries, requests, job review, shortlist, talent pool, admin company verification | IMPLEMENTED NOT VERIFIED | RLS tested on scratch PG only |
| AI | CV Studio (build/analyze/tailor/export) | NOT STARTED / BLOCKED | no API key; page is informational and labelled |
| Security | RLS policies 0001–0008 | DONE & TESTED on scratch PostgreSQL 16 (32/32, 78/78, 11/11) · NOT run on a real Supabase project |
| Security | Rate limiting, audit log table, error monitoring | NOT STARTED (audit tables drafted) | |
| Ops | Independent Staging | BLOCKED | owner must create project |
