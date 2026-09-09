import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 375, height: 812 } });

test("mobile login form has a logical keyboard order", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "The Flock" }).focus();

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();
  await expectVisibleFocus(page.getByRole("button", { name: "Sign in" }));
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Create an account" })).toBeFocused();
});

test("mobile auth and signed-in UI fit without horizontal overflow", async ({
  page,
}) => {
  const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const username = `mobile_${id}`;

  await page.goto("/register");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "The Flock" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Email")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Username")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Display name")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Create account" })).toBeFocused();

  await page.getByLabel("Email").fill(`mobile-${id}@example.com`);
  await page.getByLabel("Username").fill(username);
  await page
    .getByLabel("Display name")
    .fill("A Mobile Display Name That Still Wraps Cleanly");
  await page.getByLabel("Password").fill("Demo1234!");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByLabel("Compose a post")).toBeVisible();
  await expect(page.getByRole("link", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Profile", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "The Flock" }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Search" })).toBeFocused();
  await expectVisibleFocus(page.getByRole("link", { name: "Search" }));
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Profile", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Sign out" })).toBeFocused();

  await page.getByLabel("Compose a post").fill("A mobile note");
  await expect(page.getByRole("button", { name: "Post" })).toBeEnabled();
});

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBe(dimensions.clientWidth);
}

async function expectVisibleFocus(
  locator: import("@playwright/test").Locator,
) {
  const outline = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return { style: style.outlineStyle, width: style.outlineWidth };
  });

  expect(outline.style).not.toBe("none");
  expect(outline.width).not.toBe("0px");
}
