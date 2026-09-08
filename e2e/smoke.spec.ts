import { expect, test } from "@playwright/test";

test("application loads", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "The Flock" }),
  ).toBeVisible();
});
