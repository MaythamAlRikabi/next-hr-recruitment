import test from "node:test";
import assert from "node:assert/strict";
import { parseCriteria, criterionText, monthsText } from "./eligibility.ts";

test("parseCriteria: empty means no conditions", () => {
  assert.deepEqual(parseCriteria(""), []);
  assert.deepEqual(parseCriteria(undefined), []);
});

test("parseCriteria: accepts valid rules, rejects bad ones", () => {
  const ok = parseCriteria('[{"kind":"education","field":"pharmacy","level":"bachelor","required":true},{"kind":"experience","field":"sales","min_years":2,"required":false}]');
  assert.equal(ok?.length, 2);
  assert.equal(parseCriteria('[{"kind":"education","required":true}]'), null);
  assert.equal(parseCriteria('[{"kind":"experience","field":"nope","required":true}]'), null);
  assert.equal(parseCriteria('[{"kind":"experience","field":"sales","min_years":2.3,"required":true}]'), null);
  assert.equal(parseCriteria("not json"), null);
  assert.equal(parseCriteria(JSON.stringify(Array(9).fill({ kind: "experience", field: "sales", required: true }))), null);
});

test("criterionText reads naturally", () => {
  assert.equal(criterionText({ kind: "education", field: "pharmacy", level: "bachelor", required: true }, "ar"), "بكالوريوس فأعلى في الصيدلة");
  assert.equal(criterionText({ kind: "experience", field: "sales", min_years: 2, required: true }, "ar"), "خبرة في المبيعات لا تقل عن سنتين");
  assert.equal(monthsText(30, "ar"), "سنتان و6 أشهر");
});
