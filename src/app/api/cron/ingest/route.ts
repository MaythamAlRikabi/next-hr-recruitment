import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runIngest } from "@/lib/ingest/run";

/**
 * Daily importer, called by Vercel Cron (Production deployments only) with `Authorization: Bearer $CRON_SECRET`.
 * Fetches the active sources, stores new posts as `pending_review`; nothing is published without a recruiter's approval.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const db = createAdminClient();
  if (!secret || !db) return NextResponse.json({ ok: false, error: "importer not configured" }, { status: 503 });
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return NextResponse.json({ ok: false }, { status: 401 });
  const reports = await runIngest(db);
  return NextResponse.json({ ok: true, reports });
}
