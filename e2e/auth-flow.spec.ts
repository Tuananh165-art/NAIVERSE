import { expect, test } from "@playwright/test";

test("register sends username and password to Supabase and shows email-confirmation state", async ({ page }) => {
  let received: Record<string, unknown> | undefined;
  await page.route("**/auth/v1/signup*", async (route) => {
    received = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "11111111-1111-4111-8111-111111111111",
        aud: "authenticated",
        role: "authenticated",
        email: "naiverse-test@example.com",
        email_confirmed_at: null,
        confirmation_sent_at: "2026-10-16T00:00:00Z",
        app_metadata: { provider: "email", providers: ["email"] },
        user_metadata: { full_name: "NaiVerse Test", username: "naiverse_test", locale: "vi" },
        identities: [{ identity_id: "22222222-2222-4222-8222-222222222222", id: "11111111-1111-4111-8111-111111111111", user_id: "11111111-1111-4111-8111-111111111111", identity_data: { email: "naiverse-test@example.com" }, provider: "email", last_sign_in_at: null, created_at: "2026-10-16T00:00:00Z", updated_at: "2026-10-16T00:00:00Z" }],
        created_at: "2026-10-16T00:00:00Z",
        updated_at: "2026-10-16T00:00:00Z",
      }),
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
    data: { full_name: "NaiVerse Test", username: "naiverse_test", locale: "vi" },
  });
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
