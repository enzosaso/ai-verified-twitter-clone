import { expect, test } from "@playwright/test";

test("application loads", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: "The Flock" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Short notes. A small flock." }),
  ).toBeVisible();
});
