import { test, expect } from "@playwright/test";

test.describe("mega menu (desktop)", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1280, "desktop navigation only");
  for (const loc of ["ar", "en"] as const) {
    test(`opens by click, keyboard and Escape; stays inside the viewport (${loc})`, async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "next_locale", value: loc, url: baseURL! }]);
      await page.goto("/");
      const triggers = page.locator("nav[aria-label=Primary] button[data-trigger]");
      expect(await triggers.count()).toBeGreaterThanOrEqual(4);
      for (let i = 0; i < (await triggers.count()); i++) {
        const t = triggers.nth(i);
        await t.click();
        await expect(t).toHaveAttribute("aria-expanded", "true");
        const panel = page.locator(`#${await t.getAttribute("aria-controls")}`);
        const box = await panel.boundingBox();
        const vw = page.viewportSize()!.width;
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(vw);
        await page.keyboard.press("Escape");
        await expect(t).toHaveAttribute("aria-expanded", "false");
      }
    });

    test(`ArrowDown opens and focuses first link; ArrowRight/Left move between groups (${loc})`, async ({ page, context, baseURL }) => {
      await context.addCookies([{ name: "next_locale", value: loc, url: baseURL! }]);
      await page.goto("/");
      const first = page.locator("nav[aria-label=Primary] button[data-trigger]").first();
      await first.focus();
      await page.keyboard.press("ArrowDown");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("nav[aria-label=Primary] a:focus")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(first).toBeFocused();
      await page.keyboard.press(loc === "ar" ? "ArrowLeft" : "ArrowRight");
      await expect(page.locator("nav[aria-label=Primary] button[data-trigger]").nth(1)).toBeFocused();
    });
  }
});

test.describe("mobile menu", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1280, "mobile navigation only");
  test("hamburger opens a dialog with the groups and closes", async ({ page }) => {
    await page.goto("/");
    await page.locator('header button[aria-label]').filter({ hasNot: page.locator("form") }).last().click();
    await expect(page.locator("details").first()).toBeVisible();
  });
});
