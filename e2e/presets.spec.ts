import { test, expect } from "@playwright/test";

test("kzIban uppercases typed account letters", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("iban");
  await input.click();
  await input.pressSequentially("86125kzt5004100100");
  await expect(input).toHaveValue("KZ86 125K ZT50 0410 0100");
});

test("kzPlate uppercases and restricts letters", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("plate");
  await input.click();
  await input.pressSequentially("123abc02");
  await expect(input).toHaveValue("123 ABC 02");
});

test("hex token accepts hex digits only", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("hex");
  await input.click();
  await input.pressSequentially("1ag2");
  await expect(input).toHaveValue("1a2"); // 'g' rejected
});
