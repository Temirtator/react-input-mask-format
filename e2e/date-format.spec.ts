import { test, expect } from "@playwright/test";
import { pasteInto, autofillFocused } from "./helpers";

test("DateFormat clamps the day and month and inserts separators while typing", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date-format");
  await input.click();
  await input.pressSequentially("45139999");
  await expect(input).toHaveValue("31.12.9999");
});

test("DateFormat shows a trailing separator after a complete field", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date-format");
  await input.click();
  await input.pressSequentially("12");
  await expect(input).toHaveValue("12.");
});

test("Backspace steps back over both separators", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date-format");
  await input.click();
  await input.pressSequentially("12053");
  await expect(input).toHaveValue("12.05.3");
  for (const expected of ["12.05.", "12.0", "12.", "1", ""]) {
    await input.press("Backspace");
    await expect(input).toHaveValue(expected);
  }
});

test("useDateFormat masks a raw input in ISO order", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date-format-hook");
  await input.click();
  await input.pressSequentially("20240512");
  await expect(input).toHaveValue("2024-05-12");
});

test("a pasted ISO date lands in the right fields", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date-format");
  await pasteInto(page, input, "2024-05-12");
  await expect(input).toHaveValue("12.05.2024");
});

test("an autofilled date without leading zeros is padded", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date-format");
  await autofillFocused(input, "1.5.2024");
  await expect(input).toHaveValue("01.05.2024");
});
