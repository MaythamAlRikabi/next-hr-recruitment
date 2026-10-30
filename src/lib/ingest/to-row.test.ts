import test from "node:test";
import assert from "node:assert/strict";
import { toRow } from "./to-row.ts";

const POST = `الشاغر الوظيفي: مندوب مبيعات
لأحد عملاء شركة MasterMinds من الشركات الرائدة في مجال قطاع الخرسانة الجاهزة
موقع العمل:بغداد
الراتب: 700$ - 1000$ + عمولات
المهام:
- زيارة العملاء الحاليين والجدد
- متابعة التحصيل
المتطلبات:
- خبرة سنتين في المبيعات
- امتلاك سيارة
للتقديم: https://forms.example.com/apply`;

test("toRow: complete post becomes a pending-review row with source info and no invented values", () => {
  const r = toRow({ ref: "manual/abc", url: "", text: POST }, { id: null, label: "Telegram – test" });
  assert.ok(r);
  assert.equal(r.title, "مندوب مبيعات");
  assert.equal(r.city, "baghdad");
  assert.equal(r.apply_url, "https://forms.example.com/apply");
  assert.equal(r.source_label, "Telegram – test");
  assert.equal(r.raw_hash.length, 64);
  assert.ok(r.responsibilities.length >= 2 && r.requirements.length >= 2);
  assert.equal(r.salary_currency, "USD");
});

test("toRow: text with no title or no way to apply is skipped, never guessed", () => {
  assert.equal(toRow({ ref: "x", url: "", text: "اهلا وسهلا بكم في قناتنا نتمنى لكم يوما سعيدا ومليئا بالنجاح والتوفيق" }, { id: null, label: "t" }), null);
});
