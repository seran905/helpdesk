import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "password123";
export const AGENT_EMAIL = "agent@example.com";
export const AGENT_PASSWORD = "password123";

/**
 * Logs in through the real login form and waits for the redirect to `/`
 * that only happens once the session is established.
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL("/");
}
