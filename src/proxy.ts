import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED: Array<[prefix: string, roles: string[]]> = [
  ["/candidate", ["candidate"]],
  ["/employer", ["employer"]],
  ["/agency", ["next_recruiter", "next_admin", "super_admin"]],
  ["/admin", ["next_admin", "super_admin"]],
  ["/notifications", []],
  ["/account", []], // any signed-in user
];

/** Refreshes the Supabase session and gates private areas. Authorization is re-checked server-side and by RLS. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const { pathname } = request.nextUrl;
  const rule = PROTECTED.find(([p]) => pathname === p || pathname.startsWith(p + "/"));

  if (!url || !key) {
    // Fail closed for private areas when auth is not configured.
    if (rule) return NextResponse.redirect(new URL("/login", request.url));
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;

  if (rule) {
    if (!uid) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (rule[1].length) {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      const has = (roles ?? []).some((r) => rule[1].includes(r.role as string));
      if (!has) return NextResponse.redirect(new URL("/not-authorized", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|svg|ico|webp)$).*)"],
};
