import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRoles, homeFor } from "@/lib/auth";
import { safeNext } from "@/lib/validation";

/** PKCE callback: exchanges the one-time code from the e-mail link for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "");
  if (!code) return NextResponse.redirect(`${origin}/login?error=callback`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/login?error=callback`);
  const target = next || homeFor(await getRoles(data.user.id));
  return NextResponse.redirect(`${origin}${target}`);
}
