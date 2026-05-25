// E2E test for the authentication page.
// Compare with unit tests (tests/unit/photos/*): unit tests verify isolated logic.
// UI tests verify the full stack — SSR rendering, form submission, redirects.
// Mantine renders ALL tab panels in the DOM (including hidden ones); we scope
// selectors to the active form using the form's action attribute.
import { test, expect } from "@playwright/test";

// Scope to the visible login form (action="/api/auth/login")
const loginForm = (page: import("@playwright/test").Page) =>
  page.locator('form[action="/api/auth/login"]');

test.describe("Authentication page", () => {
  test("shows Welcome Back heading and login form by default", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByText("Welcome Back")).toBeVisible();
    await expect(loginForm(page).getByLabel("Email")).toBeVisible();
    await expect(loginForm(page).getByLabel("Password")).toBeVisible();
    await expect(loginForm(page).getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("switches to Register tab and shows Register form", async ({ page }) => {
    await page.goto("/auth");
    await page.getByRole("tab", { name: "Register" }).click();
    // "Join our photo gallery community" is unique to the Register panel
    await expect(page.getByText("Join our photo gallery community")).toBeVisible({ timeout: 5000 });
  });

  test("has Sign In and Register tabs", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.getByRole("tab", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Register" })).toBeVisible();
  });

  test("unauthenticated requests to / redirect to /auth", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth/, { timeout: 5000 });
  });

  test("unauthenticated users stay on /auth when visiting /auth directly", async ({ page }) => {
    await page.goto("/auth");
    await expect(page).toHaveURL(/\/auth/);
  });
});
