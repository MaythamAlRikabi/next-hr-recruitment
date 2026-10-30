import { NextResponse } from "next/server";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Secure download of the CV an applicant attached to ONE application.
 * No access logic lives here: the application row, the resume row and the Storage object are all read with the
 * caller's own session, so row-level security decides (hiring company of a direct job, NEXT staff, or the candidate).
 * The signed link is valid for 60 seconds and is never stored.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return new NextResponse("Not found", { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return new NextResponse("Unauthorized", { status: 401 });
  const supabase = await createClient();
  const { data: app } = await supabase.from("applications").select("resume_id, status").eq("id", id).maybeSingle();
  if (!app?.resume_id || app.status === "withdrawn") return new NextResponse("Not found", { status: 404 });
  const { data: resume } = await supabase.from("resumes").select("storage_path, file_name").eq("id", app.resume_id).maybeSingle();
  if (!resume) return new NextResponse("Not found", { status: 404 });
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(resume.storage_path, 60, { download: resume.file_name });
  if (error || !data?.signedUrl) return new NextResponse("Not found", { status: 404 });
  const res = NextResponse.redirect(data.signedUrl, 302);
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
