/**
 * Deterministic parser for job announcements written as free text (Telegram / Facebook / LinkedIn posts, e-mails),
 * Arabic or English, in the common "label: value" + bullet layout. No network, no AI: the same input always gives the
 * same output, and every guess is reported in `warnings` so a NEXT recruiter can correct it before anything is published.
 * Dependency-free on purpose (runs under `node --test`).
 */

export type ParsedJob = {
  title: string | null;
  /** Employer description as written ("a client of X, a leading company in ..."), never rewritten. */
  clientNote: string | null;
  /** Recruitment agency / poster named in the text ("لأحد عملاء شركة X"). */
  agency: string | null;
  city: string | null; // slug
  cityText: string | null;
  industry: string | null; // slug
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: "IQD" | "USD" | null;
  salaryNote: string | null; // e.g. commission / negotiable
  employmentType: "full_time" | "part_time" | "contract" | "internship" | "temporary";
  responsibilities: string[];
  requirements: string[];
  applyUrl: string | null;
  applyEmail: string | null;
  language: "ar" | "en";
  warnings: string[];
};

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function normalizeText(raw: string): string {
  return raw
    .replace(/[‎‏‪-‮⁦-⁩﻿]/g, "") // bidi marks
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, " ") // emoji and pictographs
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .trim();
}

const CITIES: [string, string[]][] = [
  ["baghdad", ["بغداد", "baghdad"]], ["erbil", ["أربيل", "اربيل", "erbil", "arbil"]], ["basra", ["البصرة", "البصره", "basra", "basrah"]],
  ["sulaymaniyah", ["السليمانية", "السليمانيه", "sulaymaniyah", "sulaimani", "slemani"]], ["mosul", ["الموصل", "mosul"]],
  ["najaf", ["النجف", "najaf"]], ["karbala", ["كربلاء", "كربلا", "karbala"]], ["kirkuk", ["كركوك", "kirkuk"]], ["duhok", ["دهوك", "duhok", "dohuk"]],
];

const INDUSTRIES: [string, RegExp][] = [
  ["pharmaceutical", /صيدل|أدوية|ادوية|pharma/i],
  ["healthcare", /رعاية صحية|مستشفى|طبي|healthcare|hospital|medical/i],
  ["it", /تكنولوجيا المعلومات|برمج|تطوير (?:ال)?(?:برمجيات|تطبيقات)|\bit\b|software|developer|devops|cyber/i],
  ["fmcg", /سلع استهلاكية|مواد غذائية|fmcg|consumer goods|food & beverage/i],
  ["engineering", /هندس|خرسان|بناء|إنشاء|انشاء|مقاول|construction|concrete|engineer/i],
  ["finance", /مالي|محاسب|بنك|مصرف|finance|accountant|banking|audit/i],
  ["human-resources", /موارد بشرية|human resources|\bhr\b|recruit/i],
  ["logistics", /لوجست|شحن|نقل|توريد|logistics|supply chain|warehouse/i],
  ["education", /تعليم|مدرس|جامعة|education|teacher|university/i],
  ["sales-marketing", /مبيعات|تسويق|sales|marketing/i],
];

type SectionKey = "title" | "location" | "salary" | "responsibilities" | "requirements" | "apply" | "client" | "type";
const LABELS: [SectionKey, RegExp][] = [
  ["title", /^(?:الشاغر(?: الوظيفي)?|المسمى الوظيفي|المسمى|الوظيفة|vacancy|job title|position|role)\s*[:：-]\s*(.*)$/i],
  ["location", /^(?:موقع العمل|مكان العمل|الموقع|المدينة|location|work location|city)\s*[:：-]\s*(.*)$/i],
  ["salary", /^(?:الراتب|الأجر|الاجر|salary|compensation|pay)\s*[:：-]\s*(.*)$/i],
  ["type", /^(?:نوع (?:الدوام|العمل)|الدوام|employment type|job type)\s*[:：-]\s*(.*)$/i],
  ["responsibilities", /^(?::\s*)?(?:المهام(?: الوظيفية)?|المسؤوليات|المسؤوليات الوظيفية|responsibilities|duties|key tasks|tasks)\s*[:：]?\s*$/i],
  ["requirements", /^(?::\s*)?(?:المتطلبات|الشروط|المؤهلات|requirements|qualifications|skills)\s*[:：]?\s*$/i],
  ["apply", /^(?:للتقديم|التقديم|طريقة التقديم|رابط التقديم|how to apply|apply(?: now| here| via| at)?)\s*[:：-]?\s*(.*)$/i],
];

const BULLET = /^\s*(?:[•●▪◦·*\-–—✓✔➤►]|\d{1,2}[.)])\s*/;

export function parseJobPost(raw: string): ParsedJob {
  const text = normalizeText(raw);
  const warnings: string[] = [];
  const lines = text.split("\n").map((l) => l.trim());
  const arabicChars = (text.match(/[؀-ۿ]/g) ?? []).length;
  const language: "ar" | "en" = arabicChars > text.length * 0.2 ? "ar" : "en";

  const r: ParsedJob = {
    title: null, clientNote: null, agency: null, city: null, cityText: null, industry: null,
    salaryMin: null, salaryMax: null, salaryCurrency: null, salaryNote: null, employmentType: "full_time",
    responsibilities: [], requirements: [], applyUrl: null, applyEmail: null, language, warnings,
  };

  let section: SectionKey | null = null;
  const loose: string[] = []; // lines before the first label
  let seenLabel = false;
  const bucket: Record<SectionKey, string[]> = { title: [], location: [], salary: [], responsibilities: [], requirements: [], apply: [], client: [], type: [] };

  for (const line of lines) {
    if (!line || /^\/+$/.test(line)) continue;
    let matched = false;
    for (const [key, re] of LABELS) {
      const m = line.replace(/^[:：]\s*/, (s) => (key === "responsibilities" || key === "requirements" ? s : "")).match(re);
      if (m) {
        section = key; seenLabel = true; matched = true;
        const rest = (m[1] ?? "").trim();
        if (rest) bucket[key].push(rest);
        break;
      }
    }
    if (matched) continue;
    if (!seenLabel) { loose.push(line); continue; }
    if (section) bucket[section].push(line);
  }

  // Title
  r.title = clean(bucket.title[0] ?? null);
  if (!r.title) {
    // e.g. "We are hiring: Sales Representative" or first non-agency line
    const h = loose.find((l) => /(?:hiring|نبحث عن|مطلوب|فرصة عمل|we are looking for)\s*[:：-]?\s*(.+)/i.test(l));
    const mm = h?.match(/(?:hiring|نبحث عن|مطلوب|فرصة عمل|we are looking for)\s*[:：-]?\s*(.+)/i);
    r.title = clean(mm?.[1] ?? null);
    if (r.title) warnings.push("title guessed from the headline");
  }
  if (!r.title) warnings.push("title not found");

  // Client / agency line ("لأحد عملاء شركة X من الشركات الرائدة في مجال ...")
  const clientLine = [...bucket.title.slice(1), ...loose].find((l) => /عملاء|عميل|client of|on behalf of|لصالح|leading company|من الشركات الرائدة/i.test(l));
  if (clientLine) {
    r.clientNote = clean(clientLine);
    const ag = clientLine.match(/(?:عملاء|عميل)\s+(?:شركة\s+)?([A-Za-z0-9 .&-]{2,40}?)(?=\s+(?:من|في|و)\s|\s*$|[،,.])/i) ?? clientLine.match(/client of\s+([A-Za-z0-9 .&-]{2,40}?)(?=[,.]|\s+(?:a|an|the|one)\b|\s*$)/i);
    r.agency = clean(ag?.[1] ?? null);
  }

  // Location
  const loc = bucket.location.join(" ").trim();
  if (loc) {
    r.cityText = clean(loc);
    const low = loc.toLowerCase();
    for (const [slug, names] of CITIES) if (names.some((n) => low.includes(n.toLowerCase()))) { r.city = slug; break; }
    if (!r.city) warnings.push(`city "${loc}" is not in NEXT's city list`);
  } else warnings.push("location not found");

  // Salary
  const sal = bucket.salary.join(" ").trim();
  if (sal) parseSalary(sal, r);
  else warnings.push("salary not stated");

  // Employment type
  const typeText = (bucket.type.join(" ") + " " + (r.title ?? "")).toLowerCase();
  if (/part[- ]?time|جزئي/.test(typeText)) r.employmentType = "part_time";
  else if (/intern|تدريب/.test(typeText)) r.employmentType = "internship";
  else if (/contract|عقد|مؤقت|temporary/.test(typeText)) r.employmentType = /temporary|مؤقت/.test(typeText) ? "temporary" : "contract";

  // Lists
  r.responsibilities = toItems(bucket.responsibilities);
  r.requirements = toItems(bucket.requirements);
  if (!r.responsibilities.length) warnings.push("responsibilities not found");
  if (!r.requirements.length) warnings.push("requirements not found");

  // Apply
  const applyBlob = [...bucket.apply, text].join("\n");
  const url = [...bucket.apply.join(" ").matchAll(/https?:\/\/[^\s<>"')]+/gi)].map((m) => m[0])[0]
    ?? text.match(/https?:\/\/[^\s<>"')]+/i)?.[0] ?? null;
  r.applyUrl = url ? url.replace(/[.,،؛)]+$/, "") : null;
  r.applyEmail = applyBlob.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0] ?? null;
  if (!r.applyUrl && !r.applyEmail) warnings.push("no apply link or e-mail found");

  // Industry from the client description first, then the title and requirements
  const hay = [r.clientNote, r.title, ...r.requirements.slice(0, 3)].filter(Boolean).join(" ");
  r.industry = INDUSTRIES.find(([, re]) => re.test(r.clientNote ?? ""))?.[0] ?? INDUSTRIES.find(([, re]) => re.test(hay))?.[0] ?? null;
  if (!r.industry) warnings.push("industry not recognised");

  return r;
}

const clean = (s: string | null) => (s ? s.replace(/\s+/g, " ").replace(/^[\s:：\-–—.]+|[\s:：\-–—.]+$/g, "").trim() || null : null);

function toItems(lines: string[]): string[] {
  const out: string[] = [];
  for (const l of lines) {
    if (BULLET.test(l)) out.push(l.replace(BULLET, "").trim());
    else if (out.length && !/^https?:/i.test(l)) out[out.length - 1] += " " + l; // wrapped line
    else out.push(l);
  }
  return out.map((x) => x.replace(/\s+/g, " ").trim()).filter((x) => x.length > 1);
}

function parseSalary(s: string, r: ParsedJob) {
  const nums = [...s.matchAll(/\d[\d,.\s]*\d|\d/g)].map((m) => Number(m[0].replace(/[,\s]/g, ""))).filter((n) => Number.isFinite(n) && n > 0);
  const usd = /\$|usd|دولار/i.test(s);
  const iqd = /iqd|دينار|د\.ع/i.test(s);
  if (nums.length) {
    r.salaryMin = Math.min(nums[0], nums[1] ?? nums[0]);
    r.salaryMax = Math.max(nums[0], nums[1] ?? nums[0]);
    r.salaryCurrency = usd ? "USD" : iqd ? "IQD" : r.salaryMax >= 100_000 ? "IQD" : "USD";
    if (!usd && !iqd) r.warnings.push(`salary currency assumed ${r.salaryCurrency}`);
  }
  const notes: string[] = [];
  if (/نسبة|عمولة|commission|bonus|incentive/i.test(s)) notes.push(/نسبة على المبيعات/.test(s) ? "نسبة على المبيعات" : "commission");
  if (/قابل للزيادة|قابل للتفاوض|negotiable|dependin?g on experience|حسب الخبرة/i.test(s)) notes.push(/حسب الخبرة/.test(s) ? "قابل للزيادة حسب الخبرة" : "negotiable");
  r.salaryNote = notes.length ? notes.join(" · ") : null;
}
