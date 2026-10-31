import { NextResponse } from "next/server";
import { getRoles, getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAFF = ["next_recruiter", "next_admin", "super_admin"];

/**
 * A proof file (degree certificate / employment letter) for review. NEXT staff only: employers never get this link.
 * Reads use the caller's own session, so row-level security and the Storage policy still apply; the signed URL lives 60 seconds.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if ((kind !== "education" && kind !== "experience") || !UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });
  const roles = await getRoles(viewer.id);
  if (!roles.some((r) => STAFF.includes(r))) return new NextResponse("Forbidden", { status: 403 });
  const supabase = await createClient();
  const table = kind === "education" ? "candidate_education" : "candidate_experience";
  const { data: row } = await supabase.from(table).select("proof_path, proof_name").eq("id", id).maybeSingle();
  if (!row?.proof_path) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from("credentials").createSignedUrl(row.proof_path, 60, { download: row.proof_name ?? true });
  if (error || !data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
