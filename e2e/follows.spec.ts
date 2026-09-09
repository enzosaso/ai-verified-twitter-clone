import { expect, test } from "@playwright/test";

test("follow another user, see lists and counts, then unfollow", async ({
  page,
}) => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const userB = {
    email: `follow-b-${id}@example.com`,
    username: `fb_${id}`,
    displayName: `Follow B ${id}`,
  };
  const userA = {
    email: `follow-a-${id}@example.com`,
    username: `fa_${id}`,
    displayName: `Follow A ${id}`,
  };

  await page.goto("/register");
  await page.getByLabel("Email").fill(userB.email);
  await page.getByLabel("Username").fill(userB.username);
  await page.getByLabel("Display name").fill(userB.displayName);
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: `Welcome back, ${userB.displayName}.` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

  await page.goto("/register");
  await page.getByLabel("Email").fill(userA.email);
  await page.getByLabel("Username").fill(userA.username);
  await page.getByLabel("Display name").fill(userA.displayName);
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: `Welcome back, ${userA.displayName}.` }),
  ).toBeVisible();

  await page.goto(`/users/${userA.username}`);
  await expect(page.getByRole("link", { name: "0 followers" })).toBeVisible();
  await expect(page.getByRole("link", { name: "0 following" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Follow" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Unfollow" })).toHaveCount(0);
  await expect(page.getByText(userA.email)).toHaveCount(0);

  await page.goto(`/users/${userB.username}`);
  await expect(page.getByRole("heading", { name: userB.displayName })).toBeVisible();
  await expect(page.getByRole("link", { name: "0 followers" })).toBeVisible();
  await page.getByRole("button", { name: "Follow" }).click();
  await expect(page.getByRole("button", { name: "Unfollow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "1 follower" })).toBeVisible();

  await page.getByRole("link", { name: "1 follower" }).click();
  await expect(page).toHaveURL(new RegExp(`/users/${userB.username}/followers`));
  await expect(page.getByRole("heading", { name: "Followers" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(userA.displayName) }),
  ).toBeVisible();
  await expect(page.getByText(userA.email)).toHaveCount(0);

  await page.goto(`/users/${userA.username}/following`);
  await expect(page.getByRole("heading", { name: "Following" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: new RegExp(userB.displayName) }),
  ).toBeVisible();

  await page.goto(`/users/${userB.username}`);
  await page.getByRole("button", { name: "Unfollow" }).click();
  await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "0 followers" })).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await page.goto(`/users/${userB.username}`);
  await expect(page.getByRole("link", { name: "0 followers" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Follow" })).toHaveCount(0);
  await expect(page.getByText(userB.email)).toHaveCount(0);
});
