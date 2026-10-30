import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getRoles, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

const TYPES: EmailOtpType[] = ["signup", "recovery", "email", "invite", "magiclink", "email_change"];

/** Token-hash confirmation (used when the Supabase e-mail templates link here directly). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"), "");
  if (!tokenHash || !type || !TYPES.includes(type)) return NextResponse.redirect(`${origin}/login?error=callback`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=callback`);
  const target = next || (type === "recovery" ? "/reset-password" : homeFor(await getRoles(data.user.id)));
  return NextResponse.redirect(`${origin}${target}`);
}
