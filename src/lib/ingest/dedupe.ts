/**
 * "Same ad" detection across channels and across days. An ad copied to several channels (with a different footer,
 * hashtags, emoji, line breaks or a re-typed number) must be stored once, and a repost the next day must not come back.
 * Pure functions, dependency-free (runs under `node --test`).
 */
import { normalizeText } from "./parse-job-post.ts";

export type Fingerprint = { shingles: Set<string>; words: number; contacts: Set<string>; title: Set<string>; exact: string };

const AR_FOLD: [RegExp, string][] = [[/[أإآٱ]/g, "ا"], [/ى/g, "ي"], [/ة/g, "ه"], [/ؤ/g, "و"], [/ئ/g, "ي"], [/[ً-ٰٟـ]/g, ""]];

/** Lower-case words only: no links, e-mails, hashtags, punctuation, emoji, diacritics; Arabic letter variants folded. */
export function cleanWords(raw: string): string[] {
  let t = normalizeText(raw).toLowerCase();
  t = t.replace(/https?:\/\/\S+|www\.\S+/g, " ").replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g, " ");
  t = t.replace(/#/g, " ").replace(/_/g, " ");
  for (const [re, to] of AR_FOLD) t = t.replace(re, to);
  return t.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 1);
}

export function contactsOf(raw: string): Set<string> {
  const out = new Set<string>();
  const text = normalizeText(raw);
  for (const m of text.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) out.add(`e:${m[0].toLowerCase()}`);
  const digits = text.replace(/(\d)[ \-.](?=\d)/g, "$1");
  for (const m of digits.matchAll(/(?<!\d)(?:\+|00)?(?:964)?0?(7[3-9]\d{8})(?!\d)/g)) out.add(`p:0${m[1]}`);
  for (const m of text.matchAll(/https?:\/\/(?:www\.)?([^\s/]+)(\/[^\s?#]*)?/gi)) {
    if (/^(?:t\.me|telegram\.me|wa\.me|bit\.ly|lnkd\.in|facebook\.com|fb\.com|instagram\.com|linkedin\.com|youtube\.com|youtu\.be)$/i.test(m[1]) && !(m[2] && m[2].length > 4)) continue;
    out.add(`u:${m[1].toLowerCase()}${(m[2] ?? "").replace(/\/$/, "").toLowerCase()}`);
  }
  return out;
}

export function fingerprint(text: string, title: string | null): Fingerprint {
  const w = cleanWords(text);
  const shingles = new Set<string>();
  if (w.length < 3) shingles.add(w.join(" "));
  else for (let i = 0; i + 3 <= w.length; i++) shingles.add(w.slice(i, i + 3).join(" "));
  return { shingles, words: w.length, contacts: contactsOf(text), title: new Set(cleanWords(title ?? "")), exact: w.join(" ") };
}

const overlap = <T>(a: Set<T>, b: Set<T>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n; };
const jaccard = <T>(a: Set<T>, b: Set<T>) => { const i = overlap(a, b); const u = a.size + b.size - i; return u ? i / u : 0; };

/**
 * Same ad when any of:
 *  - identical words after cleaning;
 *  - 3-word-shingle Jaccard >= 0.7 (a copy with a different header/footer);
 *  - one text is almost wholly inside the other (overlap >= 0.9 of the smaller, at least 8 shingles);
 *  - they share a phone / e-mail / apply link AND the same job title (>= 0.6) AND some common wording (>= 0.3):
 *    the same vacancy re-typed; two different jobs of one employer share the contact but not the title.
 */
export function isSameAd(a: Fingerprint, b: Fingerprint): boolean {
  if (a.exact && a.exact === b.exact) return true;
  const j = jaccard(a.shingles, b.shingles);
  if (j >= 0.7) return true;
  const small = Math.min(a.shingles.size, b.shingles.size);
  if (small >= 8 && overlap(a.shingles, b.shingles) / small >= 0.9) return true;
  if (a.contacts.size && b.contacts.size && overlap(a.contacts, b.contacts) > 0 && a.title.size && b.title.size && jaccard(a.title, b.title) >= 0.6 && j >= 0.3) return true;
  return false;
}
