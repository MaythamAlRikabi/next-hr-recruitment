import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runIngest } from "@/lib/ingest/run";
import { cronAuthorized } from "@/lib/cron-auth";

/**
 * Daily importer, called by Vercel Cron (Production deployments only) with `Authorization: Bearer $CRON_SECRET`.
 * Fetches the active sources, stores new posts as `pending_review`; nothing is published without a recruiter's approval.
 */
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const db = createAdminClient();
  if (!secret || !db) return NextResponse.json({ ok: false, error: "importer not configured" }, { status: 503 });
  if (!cronAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const reports = await runIngest(db);
  return NextResponse.json({ ok: true, reports });
}
