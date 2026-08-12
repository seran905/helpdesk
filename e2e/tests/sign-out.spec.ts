import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, login } from "./helpers.js";

test.describe("Sign out", () => {
  test("signing out redirects to /login and actually clears the session (not just client-side navigation)", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.getByRole("button", { name: "Sign out" }).click();

    await expect(page).toHaveURL("/login");

    // If the session were only navigated away from client-side (cookie still
    // valid), a fresh visit to a protected route would land on / instead.
    await page.goto("/");
    await expect(page).toHaveURL("/login");
  });
});
