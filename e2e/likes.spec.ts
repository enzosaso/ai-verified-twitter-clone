import { expect, test } from "@playwright/test";

test("like a followed tweet on home and unlike it on the profile", async ({
  page,
}) => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const userB = {
    email: `like-b-${id}@example.com`,
    username: `lb_${id}`,
    displayName: `Like B ${id}`,
    tweet: `Like note ${id}`,
  };
  const userA = {
    email: `like-a-${id}@example.com`,
    username: `la_${id}`,
    displayName: `Like A ${id}`,
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

  await page.getByLabel("Compose a post").fill(userB.tweet);
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText(userB.tweet)).toBeVisible();

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

  await page.goto(`/users/${userB.username}`);
  await page.getByRole("button", { name: "Follow" }).click();
  await expect(page.getByRole("button", { name: "Unfollow" })).toBeVisible();

  await page.goto("/");
  const homeCard = page.locator("article").filter({ hasText: userB.tweet });
  await expect(homeCard.getByText("0 likes")).toBeVisible();
  await homeCard.getByRole("button", { name: "Like" }).click();
  await expect(homeCard.getByRole("button", { name: "Unlike" })).toBeVisible();
  await expect(homeCard.getByText("1 like")).toBeVisible();

  await page.goto(`/users/${userB.username}`);
  const profileCard = page.locator("article").filter({ hasText: userB.tweet });
  await expect(profileCard.getByRole("button", { name: "Unlike" })).toBeVisible();
  await expect(profileCard.getByText("1 like")).toBeVisible();
  await expect(page.getByText(userA.email)).toHaveCount(0);

  await profileCard.getByRole("button", { name: "Unlike" }).click();
  await expect(profileCard.getByRole("button", { name: "Like" })).toBeVisible();
  await expect(profileCard.getByText("0 likes")).toBeVisible();
});
