/**
 * Owner rule: an ad is not accepted when the way to apply belongs to another recruitment company
 * (an agency hiring "on behalf of" an unnamed client). Ads whose apply route belongs to the employer itself,
 * its office or its commercial agent stay. Deterministic text rules only; nothing is guessed from names.
 */

/** The poster says it is recruiting for somebody else. */
const FOR_CLIENT = new RegExp([
  "on behalf of", "hiring for (?:a|an|one of)\\b", "recruiting for (?:a|an|one of)\\b", "\\bour clients?\\b", "\\bclient company\\b",
  "for (?:a|an) (?:leading|reputable|well[- ]known|prominent|major|multinational|renowned)[^.\\n]{0,40}(?:company|firm|organi[sz]ation)",
  "نيابة\\s?عن", "نيابةً\\s?عن", "لصالح\\s(?:شركة|احدى|إحدى)", "لحساب\\s(?:شركة|احدى|إحدى)", "عميلنا", "أحد عملائنا", "احد عملائنا",
].join("|"), "i");

/** The poster describes itself as a recruitment / staffing business. */
const AGENCY_TEXT = new RegExp([
  "recruitment", "staffing", "talent (?:acquisition|solutions)", "head[- ]?hunt", "executive search", "hr (?:services|solutions|consult)",
  "manpower", "placement (?:agency|services)", "employment agency",
  "مكتب توظيف", "شركة توظيف", "خدمات الموارد البشرية", "حلول الموارد البشرية", "استقطاب",
].join("|"), "i");

/** Host or e-mail domain labels that name a recruiting business (`masar-hr.com`, `acme-recruit.com`, `talentco.iq`). */
function agencyHost(host: string): boolean {
  const labels = host.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return labels.some((l) => l === "hr" || /^(?:recruit|talent|staffing|manpower|placement|headhunt)/.test(l));
}

function hostOf(email: string | null | undefined, url: string | null | undefined): string[] {
  const hosts: string[] = [];
  if (email && email.includes("@")) hosts.push(email.split("@")[1]!);
  try { if (url) hosts.push(new URL(url).hostname); } catch { /* not a URL */ }
  return hosts;
}

export function isThirdPartyRecruiter(text: string, email?: string | null, url?: string | null): boolean {
  if (!FOR_CLIENT.test(text)) return false;
  return AGENCY_TEXT.test(text) || hostOf(email, url).some(agencyHost);
}

/** Links that are not a way to apply: social feeds and hashtag pages, the channel's own Telegram link. */
export function isApplyLink(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    if (h === "t.me" || h === "telegram.me") return false;
    if (/(^|\.)linkedin\.com$/.test(h) && /^\/(feed|hashtag|company\/[^/]+\/?$|in\/)/.test(u.pathname)) return false;
    if (/(^|\.)(facebook|instagram|x|twitter)\.com$/.test(h) && !/\/(jobs|careers|apply|forms?)\b/i.test(u.pathname)) return false;
    return true;
  } catch { return false; }
}
