import { expect, test } from "@playwright/test";

test("search finds a user and opens a public profile without email", async ({
  page,
}) => {
  const id = Date.now().toString(36);
  const email = `search-e2e-${id}@example.com`;
  const username = `seek_${id}`;
  const displayName = `Zelda ${id}`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill(displayName);
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: `Welcome back, ${displayName}.` }),
  ).toBeVisible();

  await page.goto(`/search?q=${id}`);
  await expect(page.getByRole("link", { name: new RegExp(displayName) })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(displayName) }).click();

  await expect(page).toHaveURL(new RegExp(`/users/${username}$`));
  await expect(page.getByRole("heading", { name: displayName })).toBeVisible();
  await expect(page.getByText(`@${username}`)).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);
});

test("missing profile shows a 404", async ({ page }) => {
  await page.goto("/users/no_such_flock_user");
  await expect(
    page.getByRole("heading", { name: "This account doesn’t exist" }),
  ).toBeVisible();
});
