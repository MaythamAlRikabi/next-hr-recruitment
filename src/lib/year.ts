import { cacheLife } from "next/cache";

/**
 * Current year for the footer copyright line.
 * Reading the clock is request-time data, which Cache Components refuses to prerender
 * implicitly. Caching it for a day makes it a deliberate, build-safe value that is
 * still refreshed on its own (no hydration mismatch, no per-request rendering).
 */
export async function getCopyrightYear(): Promise<number> {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}
