import { createHash } from "node:crypto";

/** One raw post found at a source, before parsing. */
export type RawPost = { ref: string; url: string; text: string; postedAt?: string; applyUrl?: string };

export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
/** Hash used for de-duplication: same wording with different whitespace/case/digits-width is the same post. */
export const postHash = (text: string) => sha256(text.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase());

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
}
export function htmlToText(html: string): string {
  return decodeEntities(
    html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|h\d)>/gi, "\n").replace(/<[^>]+>/g, ""),
  ).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Public Telegram channel preview page (https://t.me/s/<handle>). Only channels whose owner allowed it
 * (recorded in job_sources.basis) should be configured. Returns newest-last as published on the page.
 */
export function parseTelegramPreview(html: string, handle: string): RawPost[] {
  const posts: RawPost[] = [];
  const parts = html.split(/(?=<div class="tgme_widget_message_wrap)/);
  for (const part of parts) {
    const id = part.match(/data-post="([A-Za-z0-9_]+\/(\d+))"/);
    const body = part.match(/<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div class="tgme_widget_message_(?:footer|info|reply_markup)|<a class="tgme_widget_message_(?:link|date))/);
    if (!id || !body) continue;
    const text = htmlToText(body[1]);
    if (text.length < 40) continue;
    const date = part.match(/<time[^>]*datetime="([^"]+)"/);
    const hrefs = [...body[1].matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => decodeEntities(m[1])).filter((u) => !/^https?:\/\/t\.me\//i.test(u));
    posts.push({ ref: id[1], url: `https://t.me/${id[1]}`, text, postedAt: date?.[1], applyUrl: hrefs[0] });
  }
  void handle;
  return posts;
}

/** RSS 2.0 / Atom feed items → raw posts (title + description/summary). */
export function parseFeed(xml: string): RawPost[] {
  const out: RawPost[] = [];
  const items = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/g) ?? [];
  const tag = (s: string, n: string) => {
    const m = s.match(new RegExp(`<${n}[^>]*>([\\s\\S]*?)</${n}>`, "i"));
    return m ? m[1].replace(/^<!\[CDATA\[|\]\]>$/g, "").trim() : undefined;
  };
  for (const it of items) {
    const title = tag(it, "title");
    const desc = tag(it, "content:encoded") ?? tag(it, "content") ?? tag(it, "description") ?? tag(it, "summary") ?? "";
    const link = tag(it, "link") || it.match(/<link[^>]*href="([^"]+)"/i)?.[1];
    const guid = tag(it, "guid") ?? tag(it, "id") ?? link;
    if (!title || !link || !/^https?:\/\//i.test(link)) continue;
    const text = `${decodeEntities(title)}\n\n${htmlToText(decodeEntities(desc))}`.trim();
    if (text.length < 40) continue;
    out.push({ ref: (guid ?? link).slice(0, 300), url: link, text, postedAt: tag(it, "pubDate") ?? tag(it, "published") ?? tag(it, "updated"), applyUrl: link });
  }
  return out;
}

/** schema.org JobPosting blocks (JSON-LD) in a career page → raw posts. */
export function parseJsonLdJobs(html: string, pageUrl: string): RawPost[] {
  const out: RawPost[] = [];
  const blocks = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  const visit = (n: unknown) => {
    if (Array.isArray(n)) return n.forEach(visit);
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    if (o["@graph"]) visit(o["@graph"]);
    const t = o["@type"];
    if (t === "JobPosting" || (Array.isArray(t) && t.includes("JobPosting"))) {
      const title = String(o.title ?? "").trim();
      const desc = htmlToText(String(o.description ?? ""));
      const org = (o.hiringOrganization as { name?: string } | undefined)?.name;
      const loc = ((o.jobLocation as { address?: { addressLocality?: string } } | undefined)?.address?.addressLocality) ?? "";
      const url = typeof o.url === "string" && /^https?:\/\//i.test(o.url) ? o.url : pageUrl;
      const ref = String((o.identifier as { value?: string } | undefined)?.value ?? url);
      const text = [title, org ? `الشركة: ${org}` : "", loc ? `موقع العمل: ${loc}` : "", desc].filter(Boolean).join("\n");
      if (title && text.length >= 40) out.push({ ref: ref.slice(0, 300), url, text, postedAt: typeof o.datePosted === "string" ? o.datePosted : undefined, applyUrl: url });
    }
  };
  for (const b of blocks) { try { visit(JSON.parse(b[1])); } catch { /* ignore malformed block */ } }
  return out;
}
