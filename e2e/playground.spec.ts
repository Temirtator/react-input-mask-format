import { test, expect } from "@playwright/test";

test("playground formats a custom mask and shows it in the snippet", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("playground-mask").fill("99-99");
  const input = page.getByTestId("playground-input");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("1234");
  await expect(input).toHaveValue("12-34");
  await expect(page.getByTestId("playground-value")).toHaveAttribute("data-value", "12-34");
  await expect(page.getByTestId("playground-snippet")).toContainText('<InputMask mask="99-99" />');
});

test("playground reformats text on a mask change and unmasks on an empty mask", async ({ page }) => {
  await page.goto("/");
  const mask = page.getByTestId("playground-mask");
  await mask.fill("99-99");
  const input = page.getByTestId("playground-input");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("1234");
  await mask.fill("99/99/9999");
  await expect(input).toHaveValue("12/34/____");
  await expect(page.getByTestId("playground-value")).toHaveAttribute("data-value", "12/34/____");
  await mask.fill("");
  await expect(page.getByTestId("playground-snippet")).toContainText("<InputMask />");
  await input.click();
  await input.press("End");
  await input.pressSequentially("ab");
  await expect(input).toHaveValue("12/34/____ab");
  await expect(page.getByTestId("playground-error")).toHaveCount(0);
});

test("playground preset fills the controls and the field follows it", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("playground-preset").selectOption("kzIban");
  await expect(page.getByTestId("playground-mask")).toHaveValue("KZ99 999* **** **** ****");
  await expect(page.getByTestId("playground-transform")).toHaveValue("uppercase");
  await expect(page.getByTestId("playground-snippet")).toContainText("<InputMask {...kzIban} />");
  const input = page.getByTestId("playground-input");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("86125kzt5004100100");
  await expect(input).toHaveValue("KZ86 125K ZT50 0410 0100");
});

test("playground shows an array preset read-only and masks with it", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("playground-preset").selectOption("ruPhone");
  await expect(page.getByTestId("playground-mask")).toHaveCount(0);
  await expect(page.getByTestId("playground-mask-array")).toContainText("/[3489]/");
  const input = page.getByTestId("playground-input");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("9123456789");
  await expect(input).toHaveValue("+7 (912) 345-67-89");
  await page.getByTestId("playground-preset").selectOption("");
  await expect(page.getByTestId("playground-mask")).toBeVisible();
});

test("playground alwaysShowMask toggles the empty mask", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("playground-input");
  const toggle = page.getByTestId("playground-always-show");
  await expect(input).toHaveValue("");
  await toggle.check();
  await expect(input).toHaveValue("+7 (___) ___-__-__");
  await expect(page.getByTestId("playground-snippet")).toContainText("alwaysShowMask");
  await toggle.uncheck();
  await expect(input).toHaveValue("");
  await expect(page.getByTestId("playground-snippet")).not.toContainText("alwaysShowMask");
});

test("playground maskPlaceholder accepts a full-length string or none", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("playground-mask").fill("99/99/9999");
  const placeholder = page.getByTestId("playground-placeholder");
  await placeholder.fill("dd");
  await expect(page.getByTestId("playground-placeholder-hint")).toBeVisible();
  await placeholder.fill("dd/mm/yyyy");
  await expect(page.getByTestId("playground-placeholder-hint")).toHaveCount(0);
  const input = page.getByTestId("playground-input");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("12");
  await expect(input).toHaveValue("12/mm/yyyy");
  await page.getByTestId("playground-placeholder-none").check();
  await expect(input).toHaveValue("12/");
  await expect(page.getByTestId("playground-snippet")).toContainText("maskPlaceholder={null}");
});
