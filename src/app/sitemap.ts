import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://next-hr-recruitment.vercel.app";
  return ["", "/jobs", "/jobs/external", "/employers", "/services", "/services/permanent-recruitment", "/services/talent-acquisition", "/services/workforce-planning", "/services/career-consulting", "/executive-search", "/cv-builder", "/submit-cv", "/insights", "/about", "/contact", "/faq", "/privacy", "/terms"].map((path) => ({ url: `${origin}${path}`, changeFrequency: path === "/jobs" ? "daily" : "monthly", priority: path === "" ? 1 : 0.7 }));
}
