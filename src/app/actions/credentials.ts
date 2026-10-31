"use server";

import { revalidatePath } from "next/cache";
import { getRoles, getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { dbError, fail, field, hasBackend, type OpState } from "@/lib/ops";

const STAFF = ["next_recruiter", "next_admin", "super_admin"];
const UUID = /^[0-9a-f-]{36}$/i;

/** NEXT staff verify or reject one pending proof. The database trigger enforces: only pending rows, only staff, never your own row. */
export async function reviewCredential(_p: OpState, fd: FormData): Promise<OpState> {
  const kind = field(fd, "kind"); const id = field(fd, "id"); const decision = field(fd, "decision");
  if ((kind !== "education" && kind !== "experience") || !id || !UUID.test(id) || (decision !== "verified" && decision !== "rejected")) return fail("invalid");
  if (!hasBackend()) return fail("unavailable");
  const viewer = await getViewer();
  if (!viewer) return fail("session");
  const roles = await getRoles(viewer.id);
  if (!roles.some((r) => STAFF.includes(r))) return fail("not_allowed");
  const supabase = await createClient();
  const table = kind === "education" ? "candidate_education" : "candidate_experience";
  const { data, error } = await supabase.from(table).update({ verification: decision }).eq("id", id).eq("verification", "pending").select("id");
  if (error || !data?.length) return fail(error ? dbError(error) : "not_allowed");
  revalidatePath("/agency/verifications");
  return { status: "success" };
}
