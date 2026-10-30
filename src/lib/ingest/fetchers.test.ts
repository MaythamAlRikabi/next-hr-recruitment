import test from "node:test";
import assert from "node:assert/strict";
import { parseTelegramPreview, parseFeed, parseJsonLdJobs, postHash } from "./fetchers.ts";

const TG = `<div class="tgme_widget_message_wrap js-widget_message_wrap"><div class="tgme_widget_message text_not_supported_wrap js-widget_message" data-post="jobs_iq/101"><div class="tgme_widget_message_bubble"><div class="tgme_widget_message_text js-message_text" dir="auto">الشاغر الوظيفي: محاسب<br/>موقع العمل: بغداد<br/>للتقديم: <a href="https://example.com/apply?a=1&amp;b=2">رابط</a></div><div class="tgme_widget_message_footer compact js-message_footer"><div class="tgme_widget_message_info"><a class="tgme_widget_message_date" href="https://t.me/jobs_iq/101"><time datetime="2026-10-30T08:00:00+00:00" class="time">08:00</time></a></div></div></div></div></div>
<div class="tgme_widget_message_wrap js-widget_message_wrap"><div class="tgme_widget_message" data-post="jobs_iq/102"><div class="tgme_widget_message_text js-message_text">قصير</div><div class="tgme_widget_message_footer"></div></div></div>`;

test("telegram preview: extracts text, ref, date and external apply link; skips tiny posts", () => {
  const p = parseTelegramPreview(TG, "jobs_iq");
  assert.equal(p.length, 1);
  assert.equal(p[0].ref, "jobs_iq/101");
  assert.equal(p[0].url, "https://t.me/jobs_iq/101");
  assert.match(p[0].text, /موقع العمل: بغداد/);
  assert.equal(p[0].applyUrl, "https://example.com/apply?a=1&b=2");
  assert.equal(p[0].postedAt, "2026-10-30T08:00:00+00:00");
});

test("rss + atom items", () => {
  const rss = `<rss><channel><item><title>Sales Manager</title><link>https://ex.com/j/1</link><guid>j1</guid><description><![CDATA[<p>Lead the sales team in Baghdad. 5 years experience required.</p>]]></description><pubDate>Thu, 29 Oct 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const r = parseFeed(rss);
  assert.equal(r.length, 1); assert.equal(r[0].ref, "j1"); assert.match(r[0].text, /Lead the sales team/);
  const atom = `<feed><entry><title>HR Officer</title><link href="https://ex.com/j/2"/><id>tag:ex,2:2</id><summary>Handle recruitment and payroll for our Erbil office today.</summary></entry></feed>`;
  const a = parseFeed(atom);
  assert.equal(a.length, 1); assert.equal(a[0].url, "https://ex.com/j/2");
});

test("json-ld JobPosting incl. @graph; malformed block ignored", () => {
  const html = `<script type="application/ld+json">{bad json</script><script type="application/ld+json">{"@graph":[{"@type":"JobPosting","title":"Site Engineer","description":"<p>Supervise concrete works on site, 3+ years.</p>","hiringOrganization":{"name":"Acme"},"jobLocation":{"address":{"addressLocality":"Basra"}},"url":"https://acme.example/jobs/9","identifier":{"value":"ACM-9"}}]}</script>`;
  const j = parseJsonLdJobs(html, "https://acme.example/careers");
  assert.equal(j.length, 1); assert.equal(j[0].ref, "ACM-9"); assert.match(j[0].text, /Acme/); assert.match(j[0].text, /Basra/);
});

test("postHash ignores whitespace and case differences", () => {
  assert.equal(postHash("Hello   World\n"), postHash("hello world"));
  assert.notEqual(postHash("a"), postHash("b"));
});
