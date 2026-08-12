import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, login } from "./helpers.js";
import { deleteUserByEmail } from "./db.js";

/**
 * The AddUserPage form persists real rows in the shared `helpdesk_test`
 * database. Emails are unique per test run (randomUUID) so repeated runs
 * never collide, and every created user is deleted in a `finally` block so
 * the DB doesn't accumulate junk rows across runs.
 */
function uniqueEmail() {
  return `e2e-add-user-${randomUUID()}@example.com`;
}

async function fillAndSubmitAddUserForm(
  page: import("@playwright/test").Page,
  { name, email, password, role }: { name: string; email: string; password: string; role: "Admin" | "Agent" },
) {
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("combobox", { name: "Role" }).click();
  await page.getByRole("option", { name: role }).click();
  await page.getByRole("button", { name: "Create user" }).click();
}

test.describe("AddUserPage", () => {
  test("admin creates a new agent, who can then log in", async ({ page }) => {
    const email = uniqueEmail();
    const name = "E2E New Agent";
    const password = "password123";

    try {
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto("/users/new");

      await fillAndSubmitAddUserForm(page, { name, email, password, role: "Agent" });

      await expect(page).toHaveURL("/users");

      // Sign out the admin so we can prove the new account actually works,
      // not just that the form submitted successfully.
      await page.getByRole("button", { name: "Sign out" }).click();
      await expect(page).toHaveURL("/login");

      await login(page, email, password);

      await expect(page.getByRole("heading", { name: `Welcome, ${name}` })).toBeVisible();
      // Agents don't get the Users nav link.
      await expect(
        page.getByRole("navigation").getByRole("link", { name: "Users" }),
      ).not.toBeAttached();
    } finally {
      await deleteUserByEmail(email);
    }
  });

  test("creating a user with an email that already exists shows a server error banner", async ({
    page,
  }) => {
    const email = uniqueEmail();

    try {
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
      await page.goto("/users/new");

      await fillAndSubmitAddUserForm(page, {
        name: "First User",
        email,
        password: "password123",
        role: "Agent",
      });
      await expect(page).toHaveURL("/users");

      // Attempt to create a second, different user with the same email.
      await page.goto("/users/new");
      await fillAndSubmitAddUserForm(page, {
        name: "Second User",
        email,
        password: "anotherpassword",
        role: "Admin",
      });

      await expect(page.getByText("A user with that email already exists")).toBeVisible();
      await expect(page).toHaveURL("/users/new");
    } finally {
      await deleteUserByEmail(email);
    }
  });
});
