/**
 * Owner rule (2026-10-31): published ads never show Telegram links or Telegram handles (@name, t.me/...).
 * The original post text stays untouched in `raw_text` (staff-only, used for de-duplication); every field that
 * can reach the public page goes through this.
 */
const LABEL = "(?:تلغرام|تليغرام|تيليجرام|تليجرام|telegram|tg)";
const URL_RE = new RegExp(`(?:${LABEL}\\s*[:：–-]?\\s*)?(?:https?:\\/\\/)?(?:www\\.)?(?:t\\.me|telegram\\.me|telegram\\.dog)\\/[^\\s)\\]]*`, "giu");
// a handle starts at a word boundary and is not the local part or domain of an e-mail
const HANDLE_RE = new RegExp(`(?:${LABEL}\\s*[:：–-]?\\s*)?(?<![\\w.+@-])@[A-Za-z][A-Za-z0-9_]{3,31}(?![\\w@]|\\.[A-Za-z])`, "giu");

export function stripTelegram(s: string): string {
  return s.replace(URL_RE, "").replace(HANDLE_RE, "").replace(/[ \t]{2,}/g, " ").replace(/\s+([،,.؛:])/g, "$1").replace(/(?:^|\s)(?:أو|او|or|and|و)\s*$/iu, "").trim();
}

export const stripTelegramOrNull = (s: string | null | undefined): string | null => {
  if (!s) return null;
  const v = stripTelegram(s);
  return v || null;
};

/** Channel handle in a source name, e.g. "وظائف في العراق (iraqjobs1995)" → "وظائف في العراق". */
export const cleanSourceLabel = (s: string): string => s.replace(/\s*\(\s*@?[A-Za-z0-9_]{4,32}\s*\)\s*$/, "").trim() || s;
