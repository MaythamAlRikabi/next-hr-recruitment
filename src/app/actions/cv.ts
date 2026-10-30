"use server";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { draftSchema } from "@/lib/cv";
export async function saveCvDraft(value: unknown): Promise<{ok:boolean}> {
 const viewer=await getViewer(); const parsed=draftSchema.safeParse(value);
 if(!viewer || !parsed.success) return {ok:false};
 const db=await createClient(); const {data,error}=await db.from("cv_drafts").upsert({user_id:viewer.id,document:parsed.data,updated_at:new Date().toISOString()}).select("user_id").single();
 return {ok:!error && !!data};
}
