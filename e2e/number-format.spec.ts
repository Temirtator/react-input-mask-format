import { test, expect } from "@playwright/test";

test("NumberFormat groups thousands and shows prefix while typing", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("currency");
  await input.click();
  await input.pressSequentially("1234567");
  await expect(input).toHaveValue("$ 1,234,567");
});

test("NumberFormat keeps a decimal and pads on blur-independent typing", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("currency");
  await input.click();
  await input.pressSequentially("12.5");
  await expect(input).toHaveValue("$ 12.5");
});

test("useNumberFormat groups on a raw input", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("numeric-hook");
  await input.click();
  await input.pressSequentially("9999999");
  await expect(input).toHaveValue("9 999 999");
});
