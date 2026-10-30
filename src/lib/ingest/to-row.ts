import { parseJobPost } from "./parse-job-post.ts";
import { postHash, type RawPost } from "./fetchers.ts";

export type SourceInfo = { id: string | null; label: string };

const clip = (s: string | null | undefined, n: number) => (s ? s.slice(0, n) : null);
const httpOnly = (u: string | null | undefined) => (u && /^https?:\/\/[^\s]+$/i.test(u) ? u.slice(0, 2000) : null);

/**
 * Raw post → external_jobs row (status pending_review). Returns null when the post cannot be a vacancy at all
 * (no recognisable title or no way to apply); those are counted as skipped, never invented.
 */
export function toRow(post: RawPost, src: SourceInfo) {
  const p = parseJobPost(post.text);
  const title = clip(p.title?.trim(), 160);
  const applyUrl = httpOnly(p.applyUrl) ?? httpOnly(post.applyUrl);
  const sourceUrl = httpOnly(post.url);
  if (!title || title.length < 3) return null;
  if (!applyUrl && !p.applyEmail && !sourceUrl) return null;
  const warnings = [...p.warnings];
  if (!applyUrl && !p.applyEmail) warnings.push("no apply link in text: candidates are sent to the source post");
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
    language: p.language,
    parse_warnings: warnings.slice(0, 20),
    posted_at: post.postedAt && !Number.isNaN(Date.parse(post.postedAt)) ? new Date(post.postedAt).toISOString() : null,
  };
}
