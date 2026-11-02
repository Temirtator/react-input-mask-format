import { test, expect } from "@playwright/test";
import { pasteInto } from "./helpers";

const caret = (el: HTMLInputElement) => el.selectionStart;

test("CardNumberFormat groups a Visa and reports the brand", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-number");
  await input.click();
  await input.pressSequentially("4111111111111111");
  await expect(input).toHaveValue("4111 1111 1111 1111");
  await expect(page.getByTestId("card-brand")).toHaveText("visa");
});

test("CardNumberFormat regroups an Amex as 4-6-5", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-number");
  await input.click();
  await input.pressSequentially("378282246310005");
  await expect(input).toHaveValue("3782 822463 10005");
  await expect(page.getByTestId("card-brand")).toHaveText("amex");
});

test("a pasted number with dashes is regrouped with the caret at the end", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-number");
  await pasteInto(page, input, "4111-1111-1111-1111");
  await expect(input).toHaveValue("4111 1111 1111 1111");
  await expect.poll(() => input.evaluate(caret)).toBe(19);
});

test("a digit typed in the middle across a brand change keeps the caret after it", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-number");
  await input.click();
  await input.pressSequentially("41111111");
  await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(0, 0));
  await input.press("3");
  await expect(input).toHaveValue("3411 11111");
  await expect.poll(() => input.evaluate(caret)).toBe(1);
});

test("Backspace right after a group separator deletes the digit before it", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-number");
  await input.click();
  await input.pressSequentially("41111111");
  await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(5, 5));
  await input.press("Backspace");
  await expect(input).toHaveValue("4111 111");
  await expect.poll(() => input.evaluate(caret)).toBe(3);
});

test("CardExpiryFormat splits a pasted four-digit year", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-expiry");
  await pasteInto(page, input, "12/2026");
  await expect(input).toHaveValue("12/26");
});

test("CardExpiryFormat inserts the separator and steps back over it", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-expiry");
  await input.click();
  await input.pressSequentially("12");
  await expect(input).toHaveValue("12/");
  await input.press("Backspace");
  await expect(input).toHaveValue("1");
});

test("CardCvcFormat follows the number field's brand", async ({ page }) => {
  await page.goto("/");
  const number = page.getByTestId("card-number");
  const cvc = page.getByTestId("card-cvc");
  await number.click();
  await number.pressSequentially("378282246310005");
  await cvc.click();
  await cvc.pressSequentially("12345");
  await expect(cvc).toHaveValue("1234");
  await number.click();
  await number.press("ControlOrMeta+a");
  await number.pressSequentially("4111111111111111");
  await expect(page.getByTestId("card-brand")).toHaveText("visa");
  await expect(cvc).toHaveValue("123");
});

test("useCardNumberFormat groups a raw input", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("card-number-hook");
  await input.click();
  await input.pressSequentially("5555555555554444");
  await expect(input).toHaveValue("5555 5555 5555 4444");
  await expect(page.getByTestId("card-brand-hook")).toHaveText("mastercard");
});
