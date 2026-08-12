import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, login } from "./helpers.js";

test.describe("HomePage", () => {
  test("shows the logged-in user's name and reports API status once the health check resolves", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page.getByRole("heading", { name: "Welcome, Admin" })).toBeVisible();

    // Starts as "Checking API status..." and flips once the real fetch to
    // /api/health resolves — assert on the final state, not the transient one.
    await expect(page.getByText("All systems operational")).toBeVisible();
  });
});
