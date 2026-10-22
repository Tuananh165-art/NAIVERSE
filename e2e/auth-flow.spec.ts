import { expect, test } from "@playwright/test";

test("register sends account details to the server and shows email-confirmation state", async ({ page }) => {
  let received: Record<string, unknown> | undefined;
  await page.route("**/api/auth/signup", async (route) => {
    received = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, session: false }),
    });
  });

  await page.goto("/vi/auth");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await page.getByLabel("Tên hiển thị").fill("NaiVerse Test");
  await page.getByLabel("Tên đăng nhập").fill("NaiVerse_Test");
  await page.getByLabel("Email").fill("naiverse-test@example.com");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill("correct-horse-battery");
  await page.getByRole("button", { name: "Tạo tài khoản" }).last().click();

  await expect(page.getByRole("status")).toBeVisible();
  expect(received).toMatchObject({
    email: "naiverse-test@example.com",
    password: "correct-horse-battery",
    fullName: "NaiVerse Test",
    username: "naiverse_test",
    locale: "vi",
  });
});

test("register explains when Supabase rate limits signup or confirmation email", async ({ page }) => {
  await page.route("**/api/auth/signup", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "auth_rate_limit", message: "Too many sign-up attempts." } }),
    });
  });

  await page.goto("/vi/auth");
  await page.locator("form.auth-panel button[type=button]").nth(1).click();
  await page.locator("#full-name").fill("NaiVerse Test");
  await page.locator("#auth-username").fill("naiverse_test");
  await page.locator("#auth-email").fill("naiverse-test@example.com");
  await page.locator("#auth-password").fill("correct-horse-battery");
  await page.locator("form.auth-panel button[type=submit]").click();

  await expect(page.locator("form.auth-panel").getByRole("alert")).toContainText("Supabase");
  await expect(page.locator("form.auth-panel").getByRole("alert")).toContainText("SMTP");
});

test("username login sends credentials to the server endpoint and displays a generic failure", async ({ page }) => {
  let received: unknown;
  await page.route("**/api/auth/username-login", async (route) => {
    received = route.request().postDataJSON();
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "invalid_credentials", message: "Invalid username or password." } }),
    });
  });

  await page.goto("/vi/auth");
  await page.getByLabel("Tên đăng nhập hoặc email").fill("naiverse_test");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill("wrong-password-value");
  await page.getByRole("button", { name: "Đăng nhập" }).click();

  await expect(page.locator("form.auth-panel").getByRole("alert")).toBeVisible();
  expect(received).toEqual({ username: "naiverse_test", password: "wrong-password-value" });
});
