import { test, expect } from "@playwright/test";

const caret = (page: import("@playwright/test").Page, id: string) =>
  page.getByTestId(id).evaluate((el: HTMLInputElement) => el.selectionStart);

test.beforeEach(async ({ page }) => {
  await page.goto("/react-input-mask-format/shadow-dom.html");
});

const cases = [
  { id: "shadow-mask", typed: "12345678", value: "12/34/5678" },
  { id: "shadow-hook", typed: "0123456789", value: "+7 (701) 234-56-78" },
  { id: "shadow-date", typed: "12052024", value: "12.05.2024" },
  { id: "shadow-card", typed: "4242424242424242", value: "4242 4242 4242 4242" }
];

for (const c of cases) {
  test(`${c.id}: typing inside a shadow root`, async ({ page }) => {
    const input = page.getByTestId(c.id);
    await input.click();
    await page.waitForTimeout(50);
    await input.pressSequentially(c.typed);
    await expect(input).toHaveValue(c.value);
    expect(await caret(page, c.id)).toBe(c.value.length);
  });
}

test("shadow-mask: Backspace in the middle inside a shadow root", async ({ page }) => {
  const input = page.getByTestId("shadow-mask");
  await input.click();
  await page.waitForTimeout(50);
  await input.pressSequentially("1234");
  await expect(input).toHaveValue("12/34/____");
  expect(await caret(page, "shadow-mask")).toBe(6);
  await input.press("Backspace");
  await expect(input).toHaveValue("12/3_/____");
  expect(await caret(page, "shadow-mask")).toBe(4);
});

test("shadow-number: typing the separator in front of a fixed fraction", async ({ page }) => {
  const input = page.getByTestId("shadow-number");
  await input.click();
  await input.pressSequentially("1234");
  await expect(input).toHaveValue("1 234.00");
  expect(await caret(page, "shadow-number")).toBe(5);
});
