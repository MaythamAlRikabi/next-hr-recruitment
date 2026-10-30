import test from "node:test";
import assert from "node:assert/strict";
import { stripSignature } from "./signature.ts";
import { cleanAdText } from "./clean.ts";
import { toRow } from "./to-row.ts";

const SIG = "▓▓▓▓▓˹𝐌𝗙˼▒▒▒▒▒▒▒▒ @Medical_Field #علي_احمد_الجنابي";

test("removes the whole watermark line", () => {
  const t = `مطلوب صيدلاني\nللتواصل 07851655919\n\n${SIG}`;
  assert.equal(stripSignature(t), "مطلوب صيدلاني\nللتواصل 07851655919");
});

test("removes the watermark at the end of a single-line field", () => {
  const f = `للتواصل واتساب 07901679657 صيدلية جونيا | عائلتك الثانية ▓▓▓▓▓˹𝐌𝗙˼▒▒▒▒▒▒▒▒  #علي_احمد_الجنابي`;
  assert.equal(cleanAdText(f), "للتواصل واتساب 07901679657 صيدلية جونيا | عائلتك الثانية");
});

test("removes the owner-name hashtag anywhere, with underscores or spaces", () => {
  assert.equal(stripSignature("مطلوب محاسب #علي_احمد_الجنابي للتقديم 07712345678"), "مطلوب محاسب  للتقديم 07712345678");
  assert.ok(!stripSignature("مطلوب محاسب علي احمد الجنابي").includes("الجنابي"));
});

test("keeps ordinary text, short block runs and other hashtags", () => {
  const t = "#فرص_العمل_للممرضين\nمطلوب ممرض ▓▒ خبرة سنة";
  assert.equal(stripSignature(t), t);
});

test("toRow: the signature never reaches the stored fields; raw_text stays original", () => {
  const post = { text: `مطلوب صيدلاني ميل حصراً\nالمهام: صرف الأدوية\nالمتطلبات: خبرة سنة\nللتقديم واتساب 07851655919\n\n${SIG}`, url: "https://t.me/Medical_Field/1", ref: "1", postedAt: new Date().toISOString() };
  const row = toRow(post, { id: null, label: "Medical Field" });
  assert.ok(row);
  const all = JSON.stringify([row.title, row.agency, row.client_note, row.salary_note, row.responsibilities, row.requirements]);
  assert.ok(!all.includes("الجنابي") && !/[▀-▟]/.test(all));
  assert.ok(row.raw_text.includes("الجنابي"));
});
