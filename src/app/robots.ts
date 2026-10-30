import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-hr-recruitment.vercel.app";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/candidate", "/employer/", "/agency", "/admin", "/account", "/login", "/register", "/reset-password", "/forgot-password"] }, sitemap: `${origin}/sitemap.xml` };
}
