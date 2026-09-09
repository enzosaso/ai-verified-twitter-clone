import { expect, test } from "@playwright/test";

test("register, persist session, logout, and login again", async ({ page }) => {
  const id = Date.now().toString(36);
  const email = `e2e-${id}@example.com`;
  const username = `e2e_${id}`;
  const password = "Demo1234!";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill("E2E Bird");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(
    page.getByRole("heading", { name: "Welcome back, E2E Bird." }),
  ).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Welcome back, E2E Bird." }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(
    page.getByRole("heading", { name: "Welcome back, E2E Bird." }),
  ).toBeVisible();
  await expect(page.getByText(`@${username}`)).toBeVisible();
});
