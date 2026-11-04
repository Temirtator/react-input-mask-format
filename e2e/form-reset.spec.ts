import { test, expect, Locator } from "@playwright/test";

const state = (input: Locator) =>
  input.evaluate((el: HTMLInputElement) => `${el.value.slice(0, el.selectionStart!)}|${el.value.slice(el.selectionStart!)}`);

test.beforeEach(async ({ page }) => {
  await page.goto("/react-input-mask-format/form-reset.html");
});

for (const id of ["reset-mask", "reset-hook"]) {
  test(`${id}: form reset brings back the formatted default value`, async ({ page }) => {
    const input = page.getByTestId(id);
    await expect(input).toHaveValue("12/12/2020");
    await input.click();
    await page.waitForTimeout(80);
    await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(10, 10));
    await page.keyboard.press("Backspace");
    await page.keyboard.press("Backspace");
    await expect(input).toHaveValue("12/12/20__");
    await page.getByTestId("reset").click();
    await expect(input).toHaveValue("12/12/2020");
    await input.click();
    await page.waitForTimeout(80);
    expect(await state(input)).toBe("12/12/2020|");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("9");
    await expect(input).toHaveValue("12/12/2029");
  });
}

test("a full value written without an event gets the caret at the end on focus", async ({ page }) => {
  const input = page.getByTestId("reset-empty");
  await input.evaluate((el: HTMLInputElement) => {
    el.value = "12345678";
  });
  await input.click();
  await page.waitForTimeout(80);
  expect(await state(input)).toBe("12/34/5678|");
  await page.keyboard.press("Backspace");
  expect(await state(input)).toBe("12/34/567|_");
});
