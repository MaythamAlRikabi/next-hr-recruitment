# Implementation log
- 2026-10-29 Phase 0/1: foundation schema, brand, bilingual homepage.
- Phase A: footer year fix; all public routes; error/404/loading/not-authorized; honest empty states (jobs); security headers.
- Phase B: migrations 0004 (inquiries), 0005 (account deletion requests, profile fields); sign-up/in/out, forgot/reset, callbacks, account page; role-gated minimal dashboards (/candidate, /employer, /agency inbox, /admin live counts).
- Deploy tooling limits: Vercel MCP only (inline files / sha refs); no GitHub; sandbox cannot reach vercel.app or supabase.co.
