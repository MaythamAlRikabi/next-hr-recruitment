import type { Locale } from "@/lib/i18n";

/** Copy for "eligible to apply": profile education/experience, job conditions, apply lock. */
const en = {
  title: "Education & experience",
  intro: "Used to check whether you meet a job's conditions before you apply. Enter only what is true: employers see it as you wrote it.",
  eduTitle: "Education", expTitle: "Work experience",
  eduEmpty: "No education added yet.", expEmpty: "No experience added yet.",
  level: "Level", field: "Field of study", institution: "Institution", optional: "optional", gradYear: "Graduation year",
  jobTitle: "Job title", workField: "Work field", years: "Years", months: "Months", choose: "Choose…",
  addEdu: "Add education", addExp: "Add experience", adding: "Saving…", remove: "Remove", removing: "…",
  saved: "Saved.",
  total: "Total in this field",
  // job page
  conditions: "Conditions to apply", required: "Required", preferred: "Preferred",
  meet: "You meet the required conditions.", cannot: "You cannot apply yet", missing: "Still missing:",
  fix: "Update my education & experience", signIn: "Sign in as a job seeker to see whether you meet them.",
  youHave: "You have", ofNeeded: "of",
  lockNote: "Applications are accepted only from candidates who meet every required condition.",
  // employer
  critTitle: "Conditions to apply (optional)",
  critHint: "A candidate who does not meet a Required condition cannot apply. Preferred conditions never block anyone.",
  addRule: "Add a condition", kindEdu: "Degree", kindExp: "Experience", any: "Any", minLevel: "Minimum level", minYears: "Minimum years",
  isRequired: "Required", removeRule: "Remove condition",
  matchBadge: (a: number, b: number) => `Meets ${a} of ${b} required conditions`,
  matchAll: "Meets all required conditions", matchNone: "No conditions set",
  selfDeclared: "Self-declared by the candidate",
};

const ar: typeof en = {
  title: "التعليم والخبرة",
  intro: "تُستخدم لمعرفة إن كنت مستوفيًا لشروط الوظيفة قبل التقديم. أدخل ما هو صحيح فقط: تراها الشركة كما كتبتها.",
  eduTitle: "التعليم", expTitle: "الخبرة العملية",
  eduEmpty: "لم تضف تعليمًا بعد.", expEmpty: "لم تضف خبرة بعد.",
  level: "المستوى", field: "التخصص الدراسي", institution: "الجهة", optional: "اختياري", gradYear: "سنة التخرج",
  jobTitle: "المسمى الوظيفي", workField: "مجال العمل", years: "سنوات", months: "أشهر", choose: "اختر…",
  addEdu: "إضافة تعليم", addExp: "إضافة خبرة", adding: "جارٍ الحفظ…", remove: "حذف", removing: "…",
  saved: "تم الحفظ.",
  total: "المجموع في هذا المجال",
  conditions: "شروط التقديم", required: "أساسي", preferred: "مفضّل",
  meet: "أنت مستوفٍ للشروط الأساسية.", cannot: "لا يمكنك التقديم حاليًا", missing: "ينقصك:",
  fix: "حدّث تعليمي وخبرتي", signIn: "سجّل الدخول كباحث عن عمل لنعرف إن كنت مستوفيًا لها.",
  youHave: "لديك", ofNeeded: "من",
  lockNote: "نقبل التقديم فقط من المتقدمين المستوفين لكل الشروط الأساسية.",
  critTitle: "شروط التقديم (اختياري)",
  critHint: "المتقدم الذي لا يستوفي شرطًا «أساسيًا» لا يستطيع التقديم. الشروط «المفضّلة» لا تمنع أحدًا.",
  addRule: "إضافة شرط", kindEdu: "شهادة", kindExp: "خبرة", any: "أي", minLevel: "أدنى مستوى", minYears: "أدنى عدد سنوات",
  isRequired: "أساسي", removeRule: "حذف الشرط",
  matchBadge: (a, b) => `يستوفي ${a} من ${b} شروط أساسية`,
  matchAll: "يستوفي كل الشروط الأساسية", matchNone: "بلا شروط",
  selfDeclared: "من إدخال المتقدم نفسه",
};

export const fit = { en, ar } satisfies Record<Locale, typeof en>;
