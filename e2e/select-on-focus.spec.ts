import { test, expect, Page } from "@playwright/test";

const selection = (page: Page, id: string) =>
  page.getByTestId(id).evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd]);

async function selectOnFocus(page: Page) {
  await page.evaluate(() => {
    document.addEventListener("focusin", event => (event.target as HTMLInputElement).select());
  });
}

const cases = [
  { id: "kzPhone", typed: "01", filled: "+7 (701) ___-__-__", key: "0", retyped: "+7 (70_) ___-__-__", empty: 5 },
  { id: "usemask", typed: "1234", filled: "12/34/____", key: "8", retyped: "8_/__/____", empty: 0 }
];

for (const c of cases) {
  test(`${c.id}: a selection made on focus survives the click on a partly filled value`, async ({ page, browserName }) => {
    test.fixme(browserName === "webkit", "WebKit collapses a select() made on focus at the following mouseup (issue #78)");
    await page.goto("/");
    const input = page.getByTestId(c.id);
    await input.click();
    await input.pressSequentially(c.typed);
    await expect(input).toHaveValue(c.filled);
    await page.getByTestId("scratch").click();
    await selectOnFocus(page);
    await input.click();
    await page.waitForTimeout(300);
    expect(await selection(page, c.id)).toEqual([0, c.filled.length]);
    await page.keyboard.type(c.key);
    await expect(input).toHaveValue(c.retyped);
  });

  test(`${c.id}: an empty value still gets the caret on the first slot`, async ({ page }) => {
    await page.goto("/");
    await selectOnFocus(page);
    await page.getByTestId(c.id).click();
    await page.waitForTimeout(300);
    expect(await selection(page, c.id)).toEqual([c.empty, c.empty]);
  });
}

test("a click that moves the mouse a little still puts the caret on the first empty slot", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("kzPhone");
  await input.click();
  await input.pressSequentially("01");
  await expect(input).toHaveValue("+7 (701) ___-__-__");
  await page.getByTestId("scratch").click();
  await input.scrollIntoViewIfNeeded();
  const box = (await input.boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 50, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 53, y);
  await page.waitForTimeout(60);
  await page.mouse.up();
  await page.waitForTimeout(300);
  await expect(input).toBeFocused();
  expect(await selection(page, "kzPhone")).toEqual([9, 9]);
  await page.keyboard.type("2");
  await expect(input).toHaveValue("+7 (701) 2__-__-__");
});
