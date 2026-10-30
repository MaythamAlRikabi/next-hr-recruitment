# Internal account features

Adds a private notification inbox for application receipts, application status changes and employer incoming applications. Candidates can subscribe to daily/weekly job matches, delivered by database cron every hour when due. Adds private CV drafts saved to an authenticated account, shared validation for imports/saves, and a transparent local completeness checklist. Drafts are never automatically shared with employers.

Database migration 20261030202347 was applied to NEXT. Both expiry and internal-alert cron schedules were verified active. Notification grants allow authenticated users to update only their own read_at; content is written by database triggers. Drafts have owner-only row policies.

Validation: production build and TypeScript passed; lint passed. The rollback-only integration test in supabase/tests/internal_features_transaction.sql is prepared, but NOT executed: the database tool confirmation expired. Full signed-in candidate/employer lifecycle, mail delivery and file-upload regression remain unverified. No claim of complete platform certification is made.

Hosting, Postgres, authentication and private file storage still use Vercel/Supabase. New notification and CV features require neither external AI nor an email provider. External job feeds inherently depend on their sources; their ingestion is not certified by this release.
