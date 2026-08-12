import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, AGENT_EMAIL, AGENT_PASSWORD, login } from "./helpers.js";

test.describe("Session-aware routing", () => {
  test("visiting / while logged out redirects to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });

  test("visiting /login while already logged in redirects to /", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/login");
    await expect(page).toHaveURL("/");
  });

  test("visiting /users while logged out redirects to /login, not /", async ({ page }) => {
    await page.goto("/users");
    await expect(page).toHaveURL("/login");
  });

  test("a logged-in session survives a full page reload", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.reload();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome, Admin" })).toBeVisible();
  });
});

test.describe("Role-based route gating on /users", () => {
  test("an authenticated agent (non-admin) visiting /users is redirected to /", async ({
    page,
  }) => {
    await login(page, AGENT_EMAIL, AGENT_PASSWORD);

    await page.goto("/users");

    await expect(page).toHaveURL("/");
  });

  test("an authenticated admin visiting /users sees the Users page", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/users");

    await expect(page).toHaveURL("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
  });
});
