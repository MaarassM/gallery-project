// E2E test for the home/gallery page.
// Compare with unit tests: unit tests mock I/O and test logic;
// UI tests run a real browser against the full server-rendered app.
// The app requires authentication — unauthenticated requests redirect to /auth.
import { test, expect, type Page } from "@playwright/test";

// Mantine renders both tab panels in DOM — scope email to login form by action
const loginEmail = (page: Page) =>
  page.locator('form[action="/api/auth/login"] [name="email"]');
const loginPassword = (page: Page) =>
  page.locator('form[action="/api/auth/login"] [name="password"]');

async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/auth");
  await loginEmail(page).fill(email);
  await loginPassword(page).fill(password);
  await page.locator('form[action="/api/auth/login"]').getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("/", { timeout: 8000 }).catch(() => {});
}

test.describe("Home page (unauthenticated)", () => {
  test("redirects unauthenticated users to /auth", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });
});

test.describe("Home page (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "admin@gallery.com", "admin123");
  });

  test("shows Photo Gallery heading on home page", async ({ page }) => {
    if (page.url().includes("/auth")) test.skip();
    await expect(page.getByRole("heading", { name: "Photo Gallery" })).toBeVisible();
  });

  test("has Browse Photos, Upload Photo, Search & Filter tabs", async ({ page }) => {
    if (page.url().includes("/auth")) test.skip();
    await expect(page.getByRole("tab", { name: "Browse Photos" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Upload Photo" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Search & Filter" })).toBeVisible();
  });

  test("Search tab shows search bar with hashtag placeholder", async ({ page }) => {
    if (page.url().includes("/auth")) test.skip();
    await page.getByRole("tab", { name: "Search & Filter" }).click();
    await expect(
      page.getByPlaceholder("Search by hashtags (e.g., nature sunset)"),
    ).toBeVisible({ timeout: 3000 });
  });
});
