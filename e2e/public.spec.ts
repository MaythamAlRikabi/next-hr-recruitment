import { test, expect } from "@playwright/test";

const PAGES = ["/", "/jobs", "/services", "/services/permanent-recruitment", "/cv-builder", "/executive-search", "/submit-cv", "/login", "/register", "/insights", "/about", "/contact", "/employers", "/faq"];

for (const loc of ["ar", "en"] as const) {
  test.describe(`public pages (${loc})`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await context.addCookies([{ name: "next_locale", value: loc, url: baseURL! }]);
    });

    for (const path of PAGES) {
      test(`${path} renders without overflow or console errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (e) => errors.push(e.message));
        page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
        const res = await page.goto(path, { waitUntil: "networkidle" });
        expect(res?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("dir", loc === "ar" ? "rtl" : "ltr");
        await expect(page.locator("h1").first()).toBeVisible();
        const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
        expect(o.sw).toBeLessThanOrEqual(o.iw + 1);
        expect(errors).toEqual([]);
      });
    }

    test("home: search form submits to /jobs with query params", async ({ page }) => {
      await page.goto("/");
      await page.locator('input[name="q"]').first().fill("sales");
      await page.locator('input[name="city"]').first().fill("Baghdad");
      await page.locator('form[role="search"] button[type="submit"]').first().click();
      await expect(page).toHaveURL(/\/jobs\?q=sales&city=Baghdad/);
    });

    test("hero sample cards are labelled as demo data", async ({ page }) => {
      await page.goto("/");
      const note = loc === "ar" ? "عرض توضيحي" : "Sample preview";
      await expect(page.getByText(note).first()).toBeAttached();
    });
  });
}

test("language toggle switches direction", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "next_locale", value: "ar", url: baseURL! }]);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator('header form button[type="submit"]').first().click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
});

test("protected areas redirect anonymous visitors to login", async ({ page }) => {
  for (const p of ["/candidate", "/employer", "/agency", "/admin"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/(login|not-authorized)/);
  }
});
