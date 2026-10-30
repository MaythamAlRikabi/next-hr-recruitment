import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cronAuthorized } from "@/lib/cron-auth";

/**
 * Daily housekeeping (Vercel Cron, Production only): after a job's closing date it is switched off.
 * published -> closed, never-published drafts -> archived, expired external posts -> expired.
 * Applications are kept. Public pages already hide a job the moment its date passes; this makes the status match.
 */
export async function GET(req: Request) {
  const db = createAdminClient();
  if (!process.env.CRON_SECRET || !db) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  if (!cronAuthorized(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const { data, error } = await db.rpc("close_expired_jobs");
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, result: data });
}
