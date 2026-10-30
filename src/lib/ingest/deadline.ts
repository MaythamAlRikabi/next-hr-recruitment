/**
 * Closing-date detection for job posts, plus the default life of an imported ad.
 * Dependency-free (runs under `node --test`). All dates are Baghdad calendar days (UTC+3, no DST).
 */
import { normalizeText } from "./parse-job-post.ts";

export const DEFAULT_LIFE_DAYS = 10;
/** A closing date further away than this is treated as a typo and ignored. */
export const MAX_DEADLINE_DAYS = 90;

const MONTHS: [number, RegExp][] = [
  [1, /كانون\s*(?:ال)?ثاني|يناير|january|jan\b/i], [2, /شباط|فبراير|february|feb\b/i], [3, /اذار|آذار|مارس|march|mar\b/i],
  [4, /نيسان|ابريل|أبريل|april|apr\b/i], [5, /ايار|أيار|مايو|may\b/i], [6, /حزيران|يونيو|june|jun\b/i],
  [7, /تموز|يوليو|july|jul\b/i], [8, /اب\b|آب\b|اغسطس|أغسطس|august|aug\b/i], [9, /ايلول|أيلول|سبتمبر|september|sep\b/i],
  [10, /تشرين\s*(?:ال)?اول|تشرين\s*(?:ال)?أول|اكتوبر|أكتوبر|october|oct\b/i], [11, /تشرين\s*(?:ال)?ثاني|نوفمبر|november|nov\b/i],
  [12, /كانون\s*(?:ال)?اول|كانون\s*(?:ال)?أول|ديسمبر|december|dec\b/i],
];
// "كانون الثاني" must be tried before "كانون الأول"; month words are matched as a whole token group below.
const MONTH_WORDS = "كانون\\s*(?:ال)?[اأ]ول|كانون\\s*(?:ال)?ثاني|تشرين\\s*(?:ال)?[اأ]ول|تشرين\\s*(?:ال)?ثاني|شباط|[اآ]ذار|نيسان|[اأ]يار|حزيران|تموز|[اآ]ب|[اأ]يلول|يناير|فبراير|مارس|[اأ]بريل|مايو|يونيو|يوليو|[اأ]غسطس|سبتمبر|[اأ]كتوبر|نوفمبر|ديسمبر|january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec";

const KEYWORD = /(?:آخر|اخر)\s*(?:موعد|يوم|تاريخ)|ينتهي\s*(?:التقديم|الإعلان|الاعلان)|(?:التقديم|تقديم)\s*(?:لغاية|لحد|حتى|حتي|قبل|ينتهي)|لغاية|حتى\s*تاريخ|قبل\s*تاريخ|deadline|closing\s*date|apply\s*(?:before|by|until)|last\s*date|closes?\s*on|valid\s*until|until/i;

const iso = (y: number, m: number, d: number) => `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const validDay = (y: number, m: number, d: number) => { const t = new Date(Date.UTC(y, m - 1, d)); return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d; };

/** Baghdad calendar day (YYYY-MM-DD) of an instant. */
export function baghdadDay(at: Date): string {
  const t = new Date(at.getTime() + 3 * 3600_000);
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}
/** 23:59:59 Baghdad time of a calendar day, as an instant. */
export const endOfBaghdadDay = (day: string): Date => new Date(`${day}T23:59:59+03:00`);

function monthOf(word: string): number | null {
  const w = word.replace(/\s+/g, " ");
  for (const [n, re] of MONTHS) if (re.test(w)) return n;
  return null;
}

/** First closing date written near a "deadline"-style keyword; null when none (or unreadable). `today` anchors a missing year. */
export function parseDeadline(raw: string, today: string): string | null {
  const text = normalizeText(raw);
  const kw = KEYWORD.exec(text);
  if (!kw) return null;
  const window = text.slice(kw.index, kw.index + kw[0].length + 60);
  const [ty] = today.split("-").map(Number);

  const numeric = window.match(/(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4}|\d{2})\b/);
  if (numeric) {
    const d = Number(numeric[1]), m = Number(numeric[2]);
    const y = numeric[3].length === 2 ? 2000 + Number(numeric[3]) : Number(numeric[3]);
    return validDay(y, m, d) ? iso(y, m, d) : null;
  }
  const dayFirst = window.match(new RegExp(`(\\d{1,2})\\s*(?:من\\s*)?(${MONTH_WORDS})\\s*(?:,?\\s*(\\d{4}))?`, "i"));
  const monthFirst = window.match(new RegExp(`(${MONTH_WORDS})\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s*(?:,?\\s*(\\d{4}))?`, "i"));
  const hit = dayFirst ? { d: Number(dayFirst[1]), mw: dayFirst[2], y: dayFirst[3] } : monthFirst ? { d: Number(monthFirst[2]), mw: monthFirst[1], y: monthFirst[3] } : null;
  if (!hit) return null;
  const m = monthOf(hit.mw);
  if (!m) return null;
  let y = hit.y ? Number(hit.y) : ty;
  if (!hit.y && addDays(iso(y, m, 1), 31) < today) y += 1; // "20 January" written in December means next year
  return validDay(y, m, hit.d) ? iso(y, m, hit.d) : null;
}

export type Life = { expiresAt: Date; deadline: string | null; note: string | null } | { expired: true };

/**
 * When an imported ad stops being shown.
 *  - closing date written in the post → end of that day (Baghdad);
 *  - none (or unreadable / more than 90 days away) → 10 days after the post was published (end of that day).
 * `expired: true` when that moment is already in the past, so old posts are never imported.
 */
export function adLife(text: string, postedAt: Date | null, now: Date): Life {
  const base = postedAt && postedAt.getTime() <= now.getTime() ? postedAt : now;
  const baseDay = baghdadDay(base);
  const found = parseDeadline(text, baghdadDay(now));
  let day = addDays(baseDay, DEFAULT_LIFE_DAYS);
  let deadline: string | null = null;
  let note: string | null = `no closing date in the post: shown for ${DEFAULT_LIFE_DAYS} days from ${baseDay}`;
  if (found) {
    if (found > addDays(baghdadDay(now), MAX_DEADLINE_DAYS)) note = `closing date ${found} is too far away: ignored, ${DEFAULT_LIFE_DAYS}-day default used`;
    else { day = found; deadline = found; note = null; }
  }
  const expiresAt = endOfBaghdadDay(day);
  return expiresAt.getTime() <= now.getTime() ? { expired: true } : { expiresAt, deadline, note };
}
