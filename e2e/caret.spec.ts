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

test("backspace after auto-inserted permanent char jumps caret over it", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("date");
  await input.click();
  await input.pressSequentially("12");
  await expect(input).toHaveValue("12/__/____");
  expect(await caret(input)).toBe(3); // caret sits right after the auto-inserted "/"
  await input.press("Backspace");
  await expect(input).toHaveValue("1_/__/____");
  expect(await caret(input)).toBe(1); // caret jumped left over the permanent "/"
});

test("legacy maskChar renders custom placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("legacy")).toHaveValue("••-••");
});

test("custom child component gets masked", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("children");
  await input.click();
  await input.pressSequentially("0102");
  await expect(input).toHaveValue("01/02/____");
});

for (const id of ["date", "usemask"]) {
  test(`${id}: Delete walks forward through a full value`, async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId(id);
    await input.click();
    await page.waitForTimeout(50);
    await input.pressSequentially("12345678");
    await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(0, 0));
    await page.waitForTimeout(50);
    await input.press("Delete");
    await expect(input).toHaveValue("_2/34/5678");
    expect(await caret(input)).toBe(1);
    await input.press("Delete");
    await input.press("Delete");
    await expect(input).toHaveValue("__/_4/5678");
    expect(await caret(input)).toBe(4);
  });
}

test("Delete on an empty slot keeps the caret there", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("usemask");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("123");
  await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(4, 4));
  await page.waitForTimeout(50);
  await input.press("Delete");
  expect(await caret(input)).toBe(4);
  await input.pressSequentially("5");
  await expect(input).toHaveValue("12/35/____");
});
