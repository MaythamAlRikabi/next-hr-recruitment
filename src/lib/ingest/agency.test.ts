import { test } from "node:test";
import assert from "node:assert/strict";
import { isApplyLink, isThirdPartyRecruiter } from "./agency.ts";
import { toRow } from "./to-row.ts";

// Shapes of real posts seen on 2026-10-30 (shortened).
const DARJAH = `#طلب_نشر
Job Opportunity | HR Learning & Development (L&D) Specialist

Darjah HR Services is hiring on behalf of a leading company in the Oil & Gas industry for the position of HR Learning & Development (L&D) Specialist.

Location: Al-Mansour, Baghdad, Iraq
Apply: https://careers.darjah-iq.com/careers/job/f65d16b9
ibrahim.mohammed@darjah-iq.com`;
const MASAR = `Job Opportunity | Heavy Equipment Sales Specialist

MASAR | Recruitment & HR Solutions is hiring on behalf of a leading company specialized in construction machinery for the position of:

Sales Specialist – Construction Machinery
Send CV to hiring@masar-hr.com`;
const HOTEL = `إعلان توظيف | فرصة عمل في فندق قلب العالم
تعلن شركة قلب العالم في بغداد عن فتح باب التقديم للتوظيف في مختلف الاختصاصات الفندقية.
الإدارة والموارد البشرية.
للتقديم: hr@whh.iq`;
const FARUK = `📢 WE ARE HIRING | Faruk Medical City
Position: Technical Services Supervisor
Faruk Medical City is seeking an experienced Technical Services Supervisor to supervise technical staff.
Send your CV to recruitment@farukmedicalcity.com`;
const AGENT = `مطلوب مندوب علمي
تعلن شركة النور الطبية، الوكيل التجاري الحصري لشركة Novatis في العراق، عن حاجتها إلى مندوب علمي في بغداد.
للتقديم: 07712345678`;
const OWN_LEADING = `Position: Sales Manager
We are a leading company in construction and we need a sales manager in Baghdad.
Send CV to recruitment@buildco.iq`;

test("agency hiring on behalf of an unnamed client is rejected", () => {
  assert.equal(isThirdPartyRecruiter(DARJAH, "ibrahim.mohammed@darjah-iq.com", "https://careers.darjah-iq.com/x"), true);
  assert.equal(isThirdPartyRecruiter(MASAR, "hiring@masar-hr.com", null), true);
  assert.equal(toRow({ ref: "a", url: "", text: DARJAH }, { id: null, label: "t" }), null);
  assert.equal(toRow({ ref: "b", url: "", text: MASAR }, { id: null, label: "t" }), null);
});

test("employer's own HR, an office or a commercial agent stays", () => {
  assert.equal(isThirdPartyRecruiter(HOTEL, "hr@whh.iq", null), false);
  assert.equal(isThirdPartyRecruiter(FARUK, "recruitment@farukmedicalcity.com", null), false);
  assert.equal(isThirdPartyRecruiter(AGENT, null, null), false);
  assert.equal(isThirdPartyRecruiter(OWN_LEADING, "recruitment@buildco.iq", null), false);
  assert.ok(toRow({ ref: "c", url: "", text: FARUK }, { id: null, label: "t" }));
});

test("social feeds and the channel's own link are not apply links", () => {
  assert.equal(isApplyLink("https://www.linkedin.com/feed/hashtag/hiring?trk=feed-detail_main-feed-card-text"), false);
  assert.equal(isApplyLink("https://t.me/medicalad12"), false);
  assert.equal(isApplyLink("https://careers.darjah-iq.com/careers/job/f65d"), true);
  assert.equal(isApplyLink("https://forms.gle/abc"), true);
});
