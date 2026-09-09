import { expect, test } from "@playwright/test";

test("home timeline shows followed and own tweets after follow", async ({
  page,
}) => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const userB = {
    email: `tl-b-${id}@example.com`,
    username: `tb_${id}`,
    displayName: `Timeline B ${id}`,
    tweet: `B note ${id}`,
  };
  const userA = {
    email: `tl-a-${id}@example.com`,
    username: `ta_${id}`,
    displayName: `Timeline A ${id}`,
    tweet: `A note ${id}`,
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
  await expect(page.getByText(userB.tweet)).toHaveCount(0);

  await page.goto(`/users/${userB.username}`);
  await page.getByRole("button", { name: "Follow" }).click();
  await expect(page.getByRole("button", { name: "Unfollow" })).toBeVisible();
  await expect(page.getByRole("link", { name: "1 follower" })).toBeVisible();

  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: `Welcome back, ${userA.displayName}.` }),
  ).toBeVisible();
  await expect(page.getByText(userB.tweet)).toBeVisible();

  await page.getByLabel("Compose a post").fill(userA.tweet);
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText(userA.tweet)).toBeVisible();
  await expect(page.getByText(userB.tweet)).toBeVisible();

  const ownBox = await page.getByText(userA.tweet).boundingBox();
  const followedBox = await page.getByText(userB.tweet).boundingBox();
  expect(ownBox?.y).toBeLessThan(followedBox?.y ?? Number.POSITIVE_INFINITY);

  await page.goto(`/users/${userB.username}`);
  await page.getByRole("button", { name: "Unfollow" }).click();
  await expect(page.getByRole("button", { name: "Follow" })).toBeVisible();
  await page.goto("/");
  await expect(page.getByText(userA.tweet)).toBeVisible();
  await expect(page.getByText(userB.tweet)).toHaveCount(0);
});
