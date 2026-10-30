import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "NEXT | HR & Recruitment",
    short_name: "NEXT",
    description: "منصة التوظيف والموارد البشرية في العراق — ابحث عن وظيفة، قدّم، وتابع طلباتك. Jobs and HR services in Iraq.",
    lang: "ar",
    dir: "rtl",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fefdff",
    theme_color: "#1261ff",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "الوظائف · Jobs", url: "/jobs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "طلباتي · My applications", url: "/candidate", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
