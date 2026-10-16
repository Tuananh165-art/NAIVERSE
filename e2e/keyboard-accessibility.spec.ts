import { expect, test } from "@playwright/test";

test("registration mode and password visibility can be operated with the keyboard", async ({ page }) => {
  await page.goto("/vi/auth");

  const registerToggle = page.getByRole("button", { name: "Tạo tài khoản" });
  await registerToggle.focus();
  await page.keyboard.press("Enter");

  await expect(page.getByLabel("Tên hiển thị")).toBeVisible();
  await expect(page.getByLabel("Tên đăng nhập")).toBeVisible();

  const password = page.getByRole("textbox", { name: "Mật khẩu" });
  await expect(password).toHaveAttribute("type", "password");

  const reveal = page.getByRole("button", { name: "Hiện mật khẩu" });
  await reveal.focus();
  await page.keyboard.press("Enter");

  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Ẩn mật khẩu" })).toBeVisible();
});
