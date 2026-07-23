import { test, expect, Locator } from "@playwright/test";

const caret = (input: Locator) =>
  input.evaluate((el: HTMLInputElement) => el.selectionStart);

test("typing a date fills mask and skips separators", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date");
  await input.click();
  await input.pressSequentially("12345678");
  await expect(input).toHaveValue("12/34/5678");
});

test("caret lands after inserted char, skipping permanent", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date");
  await input.click();
  await input.pressSequentially("12");
  expect(await caret(input)).toBe(3); // после "12/" каретка на первой редактируемой позиции
});

test("click into empty phone puts caret after prefix", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("phone");
  await input.click();
  await page.waitForTimeout(300); // mousedown-эвристика ждёт mouseup+тайминги
  expect(await caret(input)).toBe(4); // "+7 (" — первая редактируемая позиция
});

test("backspace over permanent char moves caret left", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date");
  await input.click();
  await input.pressSequentially("123");
  await expect(input).toHaveValue("12/3_/____");
  await input.press("Backspace");
  await expect(input).toHaveValue("12/__/____");
});

test("legacy maskChar renders custom placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("legacy")).toHaveValue("••-••");
});
