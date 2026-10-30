import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. BASE_URL points at the app under test (default: local `next start`).
 * Hiring-cycle specs additionally need STAGING_* variables (an independent Supabase project) and are skipped without them.
 * Never point these tests at the production database.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  retries: 0,
  reporter: [["list"], ["json", { outputFile: "e2e-results.json" }]],
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3100", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
