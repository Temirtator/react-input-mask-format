import { test, expect } from "@playwright/test";

test("useMask masks a raw input while typing", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("usemask");
  await input.click();
  await input.pressSequentially("12345678");
  await expect(input).toHaveValue("12/34/5678");
});

test("useMask fires consumer onChange with masked value (mirrored readout)", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("usemask");
  await input.click();
  await input.pressSequentially("1234");
  await expect(page.getByTestId("usemask-readout")).toHaveText("12/34/____");
});
