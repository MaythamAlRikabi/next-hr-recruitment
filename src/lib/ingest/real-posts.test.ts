import { test } from "node:test";
import assert from "node:assert/strict";
import { toRow } from "./to-row.ts";
import { fingerprint, isSameAd } from "./dedupe.ts";
import { adLife, parseDeadline } from "./deadline.ts";
import { parseJobPost } from "./parse-job-post.ts";

// Shapes taken from real posts seen on public Iraqi job channels on 2026-10-30 (shortened).
const MIRAI_A = `إعلان وظيفة شاغرة | #مدير_مالي / #مدير_حسابات

تعلن شركة ميراي للمقاولات العامة عن حاجتها إلى تعيين مدير مالي / مدير حسابات يمتلك خبرة واسعة في إدارة الشؤون المالية والمحاسبية، ويفضل أن تكون لديه خبرة في قطاع البناء والمقاولات والعقارات والشركات الهندسية.

المتطلبات والمؤهلات:

* التحصيل الدراسي: بكالوريوس محاسبة أو تخصص ذي صلة.
* الخبرة العملية: لا تقل عن 15 سنة في المجال المالي والمحاسبي.
* خبرة متقدمة في البرامج المحاسبية وأنظمة SAP / ERP.
* الإشراف على الحسابات العامة والقيود والتسويات المحاسبية.

تفاصيل الوظيفة:

* موقع العمل: #بغداد_مدينة_المستقبل.
* أوقات العمل: 8 ساعات يومياً، 6 أيام في الأسبوع.

طريقة التقديم:
يرجى إرسال السيرة الذاتية مع كتابة عنوان الوظيفة (مدير مالي / مدير حسابات) في الموضوع
hr@mirai-iq.com
07835881133`;
// same ad, re-posted later by another channel: no hashtags, no bullets, one block
const MIRAI_B = `إعلان وظيفة شاغرة | مدير مالي / مدير حسابات
تعلن شركة ميراي للمقاولات العامة عن حاجتها إلى تعيين مدير مالي / مدير حسابات يمتلك خبرة واسعة في إدارة الشؤون المالية والمحاسبية، ويفضل أن تكون لديه خبرة في قطاع البناء والمقاولات والعقارات والشركات الهندسية.
المتطلبات والمؤهلات:
التحصيل الدراسي: بكالوريوس محاسبة أو تخصص ذي صلة.
الخبرة العملية: لا تقل عن 15 سنة في المجال المالي والمحاسبي.
خبرة متقدمة في البرامج المحاسبية وأنظمة SAP / ERP.
الإشراف على الحسابات العامة والقيود والتسويات المحاسبية.
تفاصيل الوظيفة:
موقع العمل: بغداد – مدينة المستقبل.
أوقات العمل: 8 ساعات يومياً، 6 أيام في الأسبوع.
طريقة التقديم: يرجى إرسال السيرة الذاتية مع كتابة عنوان الوظيفة (مدير مالي / مدير حسابات) في الموضوع hr@mirai-iq.com 07835881133`;

const SPAR = `يعلن مصنع السبار للمذيبات النفطية في البصرة – خور الزبير عن حاجته إلى تعيين:

مهندس كيميائي بخبرة 8–10 سنوات.

الشروط والمهام:

بكالوريوس هندسة كيميائية او مايعادلها
خبرة في تشغيل وإدارة مصانع المذيبات والمشتقات النفطية.
الإلمام بعمليات التقطير والفصل والمعالجة النفطية.

على الراغبين ممن تتوفر لديهم المؤهلات المطلوبة إرسال السيرة الذاتية (CV) الى البريد الالكتروني :
info@al-spar.com`;

const OPS_MANAGER = `📢 Job Vacancy | Restaurant Operations Manager

📍 Location: Erbil
🕒 Employment Type: Full-time

Manage the main branch and all other branches, supervise staff, and oversee daily operations.

📩 07501081122`;

const INBOX_ONLY = `تعلن شركة The Italian Coffee Company عن حاجتها إلى: منسق سلسلة التوريد (Supply Chain Coordinator) ☕ الموقع: بغداد وأربيل، العراق نوع العمل: دوام كامل
المسؤوليات الرئيسية:
إدارة ومتابعة عمليات الشحن، التخزين، والتوزيع.
المتطلبات:
خبرة لا تقل عن 5 سنوات في مجال سلاسل التوريد.
📥 للتقديم: يمكنكم إرسال السيرة الذاتية (CV) إلى خاص الصفحة (Inbox)`;

const NOW = new Date("2026-10-31T09:00:00+03:00");
const post = (text: string, at = "2026-10-30T14:07:00+00:00", ref = "x/1") => ({ ref, url: `https://t.me/${ref}`, text, postedAt: at });
const src = { id: null, label: "test" };

test("titles, city and phone are found in real post shapes", () => {
  assert.equal(parseJobPost(MIRAI_A).title, "مدير مالي / مدير حسابات");
  assert.equal(parseJobPost(MIRAI_A).city, "baghdad");
  assert.equal(parseJobPost(MIRAI_A).applyPhone, "07835881133");
  assert.equal(parseJobPost(SPAR).title, "مهندس كيميائي");
  assert.equal(parseJobPost(SPAR).city, "basra");
  const ops = parseJobPost(OPS_MANAGER);
  assert.equal(ops.title, "Restaurant Operations Manager");
  assert.equal(ops.applyPhone, "07501081122");
  assert.equal(parseJobPost("Position: X Y\nCall +964 781 909 7448 now").applyPhone, "07819097448");
});

test("an ad needs an apply link, an e-mail or a phone number; otherwise it is not an ad", () => {
  assert.ok(toRow(post(MIRAI_A), src, NOW), "e-mail + phone");
  assert.ok(toRow(post(SPAR), src, NOW), "e-mail only");
  assert.ok(toRow(post(OPS_MANAGER), src, NOW), "phone only");
  assert.equal(toRow(post(INBOX_ONLY), src, NOW), null, "'send to inbox' is not enough");
  const link = `Position: Data Analyst\nLocation: Baghdad\nSome requirements here to pass the length check.\nApply: https://example.com/jobs/1`;
  assert.ok(toRow(post(link), src, NOW), "apply link only");
});

test("same ad on another channel / later day is detected; different jobs of one employer are not", () => {
  const a = fingerprint(MIRAI_A, "مدير مالي / مدير حسابات");
  const b = fingerprint(MIRAI_B, "مدير مالي / مدير حسابات");
  assert.ok(isSameAd(a, b), "re-typed copy of the same ad");
  assert.ok(isSameAd(fingerprint(SPAR, "x"), fingerprint(SPAR + "\n#وظائف_العراق", "x")), "extra hashtag line");
  const otherJob = MIRAI_A.replace(/مدير مالي \/ مدير حسابات/g, "محاسب مبيعات").replace("15 سنة", "3 سنوات").replace("خبرة متقدمة في البرامج المحاسبية وأنظمة SAP / ERP.", "إجادة Excel.").replace("الإشراف على الحسابات العامة والقيود والتسويات المحاسبية.", "متابعة فواتير المبيعات والتحصيل.");
  assert.ok(!isSameAd(a, fingerprint(otherJob, "محاسب مبيعات")), "different title, same contact");
  assert.ok(!isSameAd(fingerprint(SPAR, "مهندس كيميائي"), a));
});

test("no closing date: shown for 10 days from the post date (end of that day, Baghdad)", () => {
  const life = adLife(OPS_MANAGER, new Date("2026-10-30T12:00:00+03:00"), NOW);
  assert.ok(!("expired" in life));
  if (!("expired" in life)) {
    assert.equal(life.deadline, null);
    assert.equal(life.expiresAt.toISOString(), "2026-11-09T20:59:59.000Z"); // 2026-11-09 23:59:59 +03:00
  }
});

test("a closing date written in the post wins; a stale or far-away one does not", () => {
  assert.equal(parseDeadline("آخر موعد للتقديم 15/11/2026", "2026-10-31"), "2026-11-15");
  assert.equal(parseDeadline("Deadline: 20 November 2026", "2026-10-31"), "2026-11-20");
  assert.equal(parseDeadline("التقديم لغاية 5 تشرين الثاني", "2026-10-31"), "2026-11-05");
  assert.equal(parseDeadline("no date here", "2026-10-31"), null);
  const withDeadline = adLife(`${OPS_MANAGER}\nآخر موعد للتقديم 15/11/2026`, new Date("2026-10-30T12:00:00+03:00"), NOW);
  assert.ok(!("expired" in withDeadline) && withDeadline.deadline === "2026-11-15");
  const far = adLife(`${OPS_MANAGER}\nDeadline: 01/06/2027`, new Date("2026-10-30T12:00:00+03:00"), NOW);
  assert.ok(!("expired" in far) && far.deadline === null);
  assert.deepEqual(adLife(`${OPS_MANAGER}\nDeadline: 20/10/2026`, null, NOW), { expired: true }, "closing date already passed");
  assert.deepEqual(adLife(OPS_MANAGER, new Date("2026-10-10T12:00:00+03:00"), NOW), { expired: true }, "posted 21 days ago, 10-day life over");
  assert.equal(toRow(post(OPS_MANAGER, "2026-10-10T12:00:00+00:00"), src, NOW), null, "old posts are never imported");
});
