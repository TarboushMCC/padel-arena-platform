import { test, expect } from "@playwright/test";

test("guest can navigate to booking flow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /book now/i }).first().click();
  await expect(page).toHaveURL(/\/booking/);
});
