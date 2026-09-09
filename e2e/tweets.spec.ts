import { expect, test } from "@playwright/test";

test("create a tweet, see it on home and profile, then delete it", async ({
  page,
}) => {
  const id = Date.now().toString(36);
  const email = `tweet-e2e-${id}@example.com`;
  const username = `tw_${id}`;
  const content = `Note ${id} from the flock`;

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display name").fill("Tweet Bird");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(
    page.getByRole("heading", { name: "Welcome back, Tweet Bird." }),
  ).toBeVisible();

  await page.getByLabel("Compose a post").fill(content);
  await page.getByRole("button", { name: "Post" }).click();
  await expect(page.getByText(content)).toBeVisible();

  await page.getByRole("link", { name: "View profile" }).click();
  await expect(page).toHaveURL(new RegExp(`/users/${username}$`));
  await expect(page.getByText(content)).toBeVisible();
  await expect(page.getByText(email)).toHaveCount(0);

  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText(content)).toHaveCount(0);
  await expect(page.getByText("No posts yet.")).toBeVisible();
});
