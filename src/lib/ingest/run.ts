import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFeed, parseJsonLdJobs, parseTelegramPreview, type RawPost } from "./fetchers.ts";
import { toRow } from "./to-row.ts";

export type SourceRow = { id: string; kind: "telegram_channel" | "rss_feed" | "career_page" | "manual"; name: string; url: string | null; handle: string | null };
export type RunReport = { source: string; found: number; added: number; duplicates: number; skipped: number; error?: string };

const MAX_BYTES = 2_000_000;
const MAX_POSTS = 30;
const UA = "NEXT-HR-JobImporter/1.0 (+https://next-hr-recruitment.vercel.app; contact: info@next-hr.example)";

/** Blocks non-https and obviously internal hosts (the URLs come from staff-entered sources, but never fetch internal addresses). */
export function safeSourceUrl(raw: string): URL | null {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password) return null;
    const h = u.hostname.toLowerCase();
    if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^(\d+\.){3}\d+$/.test(h) || h.includes(":") || !h.includes(".")) return null;
    return u;
  } catch { return null; }
}

async function getText(url: URL): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/xml,application/rss+xml,application/atom+xml;q=0.9,*/*;q=0.5" }, redirect: "error", signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) throw new Error("response too large");
  return new TextDecoder("utf-8").decode(buf);
}

export async function fetchPosts(s: SourceRow): Promise<RawPost[]> {
  if (s.kind === "telegram_channel" && s.handle) return parseTelegramPreview(await getText(new URL(`https://t.me/s/${s.handle}`)), s.handle);
  const u = s.url ? safeSourceUrl(s.url) : null;
  if (!u) throw new Error("source url missing or not allowed");
  const body = await getText(u);
  if (s.kind === "rss_feed") return parseFeed(body);
  if (s.kind === "career_page") return parseJsonLdJobs(body, u.toString());
  return [];
}

/** Inserts parsed posts as pending_review. Duplicates (same text hash or same source+ref) are counted, not errors. */
export async function savePosts(db: SupabaseClient, s: Pick<SourceRow, "id" | "name">, posts: RawPost[]): Promise<Omit<RunReport, "source">> {
  const r = { found: posts.length, added: 0, duplicates: 0, skipped: 0 };
  for (const post of posts.slice(-MAX_POSTS)) {
    const row = toRow(post, { id: s.id, label: s.name });
    if (!row) { r.skipped++; continue; }
    const { error } = await db.from("external_jobs").insert(row);
    if (!error) r.added++;
    else if (error.code === "23505") r.duplicates++;
    else r.skipped++;
  }
  return r;
}

export async function runIngest(db: SupabaseClient): Promise<RunReport[]> {
  const { data: sources } = await db.from("job_sources").select("id, kind, name, url, handle").eq("active", true).neq("kind", "manual");
  const reports: RunReport[] = [];
  for (const s of (sources ?? []) as SourceRow[]) {
    let rep: RunReport;
    try {
      rep = { source: s.name, ...(await savePosts(db, s, await fetchPosts(s))) };
    } catch (e) {
      rep = { source: s.name, found: 0, added: 0, duplicates: 0, skipped: 0, error: e instanceof Error ? e.message.slice(0, 200) : "failed" };
    }
    await db.from("job_sources").update({ last_run_at: new Date().toISOString(), last_status: rep.error ? `error: ${rep.error}` : `ok: +${rep.added}, dup ${rep.duplicates}, skipped ${rep.skipped}` }).eq("id", s.id);
    reports.push(rep);
  }
  return reports;
}
