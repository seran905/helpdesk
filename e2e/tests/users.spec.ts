import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, login } from "./helpers.js";

test.describe("UsersPage", () => {
  test("shows the Users heading and an Add user link that navigates to /users/new", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto("/users");
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();

    await page.getByRole("link", { name: "Add user" }).click();

    await expect(page).toHaveURL("/users/new");
    await expect(page.getByRole("heading", { name: "Add user" })).toBeVisible();
  });
});
