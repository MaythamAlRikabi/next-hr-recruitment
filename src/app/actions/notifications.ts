"use server";
import { revalidatePath } from "next/cache";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fail, type OpState } from "@/lib/ops";
import { z } from "zod";
const alertSchema = z.object({ keyword: z.string().trim().max(80), city: z.string().trim().max(80), frequency: z.enum(["daily", "weekly"]) });
export async function createAlert(_s: OpState, fd: FormData): Promise<OpState> {
  const viewer = await getViewer(); if (!viewer) return fail("session");
  const p = alertSchema.safeParse(Object.fromEntries(fd)); if (!p.success) return fail("invalid");
  const db = await createClient();
  const { data, error } = await db.from("job_alerts").insert({ user_id: viewer.id, keyword: p.data.keyword || null, city: p.data.city || null, frequency: p.data.frequency }).select("id").single();
  if (error || !data) return fail("server");
  revalidatePath("/candidate/alerts"); return { status: "success" };
}
export async function removeAlert(_s: OpState, fd: FormData): Promise<OpState> {
  const viewer = await getViewer(); if (!viewer) return fail("session");
  const id = z.uuid().safeParse(fd.get("id")); if (!id.success) return fail("invalid");
  const db = await createClient();
  const { data, error } = await db.from("job_alerts").delete().eq("id", id.data).eq("user_id", viewer.id).select("id");
  if (error || !data?.length) return fail("server");
  revalidatePath("/candidate/alerts"); return { status: "success" };
}
export async function markNotificationsRead(): Promise<OpState> {
  const viewer = await getViewer(); if (!viewer) return fail("session");
  const db = await createClient();
  const { error } = await db.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", viewer.id).is("read_at", null);
  if (error) return fail("server");
  revalidatePath("/notifications"); return { status: "success" };
}
