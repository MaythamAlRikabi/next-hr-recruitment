import { parseJobPost } from "./parse-job-post.ts";
import { postHash, type RawPost } from "./fetchers.ts";
import { adLife } from "./deadline.ts";
import { isApplyLink, isThirdPartyRecruiter } from "./agency.ts";

export type SourceInfo = { id: string | null; label: string };

const clip = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null);
const httpOnly = (u: string | null | undefined) => (u && /^https?:\/\/[^\s]+$/i.test(u) ? u.slice(0, 2000) : null);

/**
 * Raw post → external_jobs row (status pending_review). Returns null when the post is not a usable ad:
 *  - no recognisable title, or
 *  - no way to apply written in the text (an apply link, an e-mail or a phone number: "send it to our inbox" is not enough), or
 *  - already past its closing date / older than its 10-day life, or
 *  - the apply route belongs to another recruitment company hiring on behalf of an unnamed client.
 * Those are counted as skipped, never invented.
 */
export function toRow(post: RawPost, src: SourceInfo, now: Date = new Date()) {
  const p = parseJobPost(post.text);
  const title = clip(p.title?.trim(), 160);
  const rawUrl = httpOnly(p.applyUrl) ?? httpOnly(post.applyUrl);
  const applyUrl = isApplyLink(rawUrl) ? rawUrl : null;
  const sourceUrl = httpOnly(post.url);
  if (!title || title.length < 3) return null;
  if (!applyUrl && !p.applyEmail && !p.applyPhone) return null;
  if (isThirdPartyRecruiter(post.text, p.applyEmail, rawUrl)) return null;
  const postedAt = post.postedAt && !Number.isNaN(Date.parse(post.postedAt)) ? new Date(post.postedAt) : null;
  const life = adLife(post.text, postedAt, now);
  if ("expired" in life) return null;
  const warnings = [...p.warnings];
  if (life.note) warnings.push(life.note);
  const hasSalary = p.salaryMin != null || p.salaryMax != null;
  return {
    source_id: src.id,
    source_label: src.label.slice(0, 120),
    external_ref: clip(post.ref, 300),
    source_url: sourceUrl,
    raw_text: post.text.slice(0, 20000),
    raw_hash: postHash(post.text),
    title,
    agency: clip(p.agency, 120),
    client_note: clip(p.clientNote, 400),
    city: p.city,
    industry: p.industry,
    employment_type: p.employmentType,
    salary_min: hasSalary ? p.salaryMin ?? p.salaryMax : null,
    salary_max: hasSalary ? p.salaryMax ?? p.salaryMin : null,
    salary_currency: hasSalary ? p.salaryCurrency ?? "USD" : null,
    salary_note: clip(p.salaryNote, 200),
    responsibilities: p.responsibilities.slice(0, 30),
    requirements: p.requirements.slice(0, 30),
    apply_url: applyUrl,
    apply_email: p.applyEmail,
    apply_phone: p.applyPhone,
    expires_at: life.expiresAt.toISOString(),
    language: p.language,
    parse_warnings: warnings.slice(0, 20),
    posted_at: postedAt ? postedAt.toISOString() : null,
  };
}
