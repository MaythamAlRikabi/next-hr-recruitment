import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJobPost } from "./parse-job-post.ts";

const SAMPLE = `الشاغر الوظيفي: Sales Representative

لأحد عملاء شركة MasterMinds من الشركات الرائدة في مجال قطاع الخرسانة الجاهزة  

موقع العمل:بغداد

 الراتب :1,500,000-1,800,000 + نسبة على المبيعات وقابل للزيادة حسب الخبرة
 :المهام
• تحقيق أهداف المبيعات الشهرية والفصلية (الكميات والتحصيل)
• تنفيذ خطة زيارات العملاء ومعالجة شكاواهم
• إجراء مسوحات السوق وتحليل المنافسين، ورفع تقارير أسبوعية بالأسعار وشهرية بالحصة السوقية
• متابعة حدود الائتمان وتقليل الأرصدة المتأخرة بالتنسيق مع القسم المالي
• التنسيق مع اللوجستيات وخدمة العملاء والمالية لضمان تنفيذ الطلبات بسلاسة

 المتطلبات:
• بكالوريوس هندسة مدنية أو تخصص هندسي ذي صلة
• خبرة من 1 إلى 3 سنوات في المجال،  في قطاع الخرسانة، مع معرفة بمواد البناء الأخرى
• إجادة برامج MS Office
• إتقان اللغتين العربية والإنجليزية 


 للتقديم 👇:
https://www.mastermindsiraq.com/jobs/sales-representative-commercial-1060

/`;

test("parses the MasterMinds sample post", () => {
  const j = parseJobPost(SAMPLE);
  assert.equal(j.title, "Sales Representative");
  assert.equal(j.agency, "MasterMinds");
  assert.match(j.clientNote ?? "", /الخرسانة الجاهزة/);
  assert.equal(j.city, "baghdad");
  assert.equal(j.salaryMin, 1_500_000);
  assert.equal(j.salaryMax, 1_800_000);
  assert.equal(j.salaryCurrency, "IQD");
  assert.match(j.salaryNote ?? "", /نسبة على المبيعات/);
  assert.match(j.salaryNote ?? "", /قابل للزيادة/);
  assert.equal(j.responsibilities.length, 5);
  assert.equal(j.requirements.length, 4);
  assert.match(j.requirements[0], /هندسة مدنية/);
  assert.equal(j.applyUrl, "https://www.mastermindsiraq.com/jobs/sales-representative-commercial-1060");
  assert.equal(j.industry, "engineering");
  assert.equal(j.language, "ar");
});

test("parses an English post with USD salary and e-mail", () => {
  const j = parseJobPost(`Job Title: Senior Accountant
Location: Erbil
Salary: $1,200 - $1,500 negotiable
Responsibilities:
- Prepare monthly financial statements
- Manage accounts payable
Requirements:
- BSc in Accounting
- 3+ years of experience
How to apply: send your CV to hr@example.com`);
  assert.equal(j.title, "Senior Accountant");
  assert.equal(j.city, "erbil");
  assert.equal(j.salaryCurrency, "USD");
  assert.equal(j.salaryMin, 1200);
  assert.equal(j.salaryMax, 1500);
  assert.equal(j.applyEmail, "hr@example.com");
  assert.equal(j.industry, "finance");
  assert.equal(j.language, "en");
});

test("accepts Arabic-Indic digits and reports missing fields instead of inventing them", () => {
  const j = parseJobPost(`الوظيفة: محاسب\nالراتب: ٨٠٠ دولار`);
  assert.equal(j.title, "محاسب");
  assert.equal(j.salaryMin, 800);
  assert.equal(j.salaryCurrency, "USD");
  assert.ok(j.warnings.includes("location not found"));
  assert.ok(j.warnings.includes("no apply link, e-mail or phone found"));
  assert.equal(j.applyUrl, null);
});

test("never returns a value for an empty post", () => {
  const j = parseJobPost("   ");
  assert.equal(j.title, null);
  assert.ok(j.warnings.includes("title not found"));
});
