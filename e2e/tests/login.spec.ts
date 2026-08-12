import { expect, test } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, AGENT_EMAIL, AGENT_PASSWORD, login } from "./helpers.js";

test.describe("Login - happy paths", () => {
  test("admin logs in with valid credentials and sees the Users nav link", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome, Admin" })).toBeVisible();
    await expect(page.getByRole("navigation").getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("agent logs in with valid credentials and does not see the Users nav link", async ({
    page,
  }) => {
    await login(page, AGENT_EMAIL, AGENT_PASSWORD);

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Welcome, Agent" })).toBeVisible();
    await expect(
      page.getByRole("navigation").getByRole("link", { name: "Users" }),
    ).not.toBeAttached();
  });
});

test.describe("Login - validation and error edge cases", () => {
  test("submitting the empty form shows client-side validation errors and never hits the server", async ({
    page,
  }) => {
    await page.goto("/login");

    const signInRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/sign-in/email")) signInRequests.push(req.url());
    });

    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL("/login");
    expect(signInRequests).toHaveLength(0);
  });

  test("an invalid email format shows a client-side validation error", async ({ page }) => {
    await page.goto("/login");

    const signInRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/sign-in/email")) signInRequests.push(req.url());
    });

    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page).toHaveURL("/login");
    expect(signInRequests).toHaveLength(0);
  });

  test("a real account with the wrong password is rejected by the server", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill("totally-wrong-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("a well-formed email with no matching account is rejected with the same message (no user enumeration)", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill("no-such-user@example.com");
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL("/login");
  });
});
