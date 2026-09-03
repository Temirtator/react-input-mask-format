import { test, expect } from "@playwright/test";

test("TimeFormat clamps and inserts the separator while typing", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("time");
  await input.click();
  await input.pressSequentially("2999");
  await expect(input).toHaveValue("23:59");
});

test("TimeFormat shows a trailing separator after two hour digits", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("time");
  await input.click();
  await input.pressSequentially("08");
  await expect(input).toHaveValue("08:");
});

test("useTimeFormat masks a raw input", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("time-hook");
  await input.click();
  await input.pressSequentially("0815");
  await expect(input).toHaveValue("08:15");
});
