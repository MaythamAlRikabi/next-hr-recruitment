import { test } from "@playwright/test";

/**
 * Full hiring cycle: UI → server actions → Supabase (RLS, Storage) → notifications.
 * Requires an INDEPENDENT staging project with migrations 0001–0008 applied and these variables:
 *   STAGING_SUPABASE_URL, STAGING_SUPABASE_ANON_KEY, STAGING_SERVICE_ROLE_KEY (test-data cleanup only), BASE_URL (app wired to staging).
 * Skipped otherwise. NEVER run against production.
 */
const ready = !!(process.env.STAGING_SUPABASE_URL && process.env.STAGING_SUPABASE_ANON_KEY && process.env.BASE_URL);
test.describe("hiring cycle (staging)", () => {
  test.skip(!ready, "STAGING_* variables not set — no independent staging project available");
  test.describe.configure({ mode: "serial" });

  test("candidate registers and confirms email", async () => { test.fixme(true, "to be completed against staging"); });
  test("candidate profile create/update", async () => { test.fixme(true, "to be completed against staging"); });
  test("CV upload to private storage; other users cannot read it", async () => { test.fixme(true, "to be completed against staging"); });
  test("employer registers company and requests verification", async () => { test.fixme(true, "to be completed against staging"); });
  test("staff approves company; employer publishes a job", async () => { test.fixme(true, "to be completed against staging"); });
  test("job appears in search; candidate applies", async () => { test.fixme(true, "to be completed against staging"); });
  test("employer sees application and moves stage; candidate is notified", async () => { test.fixme(true, "to be completed against staging"); });
  test("recruitment service request created and tracked in the NEXT console", async () => { test.fixme(true, "to be completed against staging"); });
  test("tenant isolation: company A cannot read company B's applications; candidate A cannot read candidate B", async () => { test.fixme(true, "to be completed against staging"); });
});
