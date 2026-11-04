import { test, expect, Locator, Page } from "@playwright/test";

const caret = (input: Locator) => input.evaluate((el: HTMLInputElement) => el.selectionStart);

const moveToEnd: Record<string, (page: Page, input: Locator) => Promise<void>> = {
  "a click at the right edge": async (page, input) => {
    const box = (await input.boundingBox())!;
    await page.mouse.click(box.x + box.width - 6, box.y + box.height / 2);
    await page.waitForTimeout(300);
  },
  "the End key": async page => {
    await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowRight" : "End");
  }
};

for (const id of ["kzPhone", "kzPhone-hook"]) {
  for (const [how, move] of Object.entries(moveToEnd)) {
    test(`${id}: typing after ${how} on a focused field goes to the slot after the last filled one`, async ({ page }) => {
      await page.goto("/");
      const input = page.getByTestId(id);
      await input.click();
      await page.waitForTimeout(300);
      await page.keyboard.type("01");
      await expect(input).toHaveValue("+7 (701) ___-__-__");
      await move(page, input);
      expect(await caret(input)).toBe(18);
      await page.keyboard.type("2345678");
      await expect(input).toHaveValue("+7 (701) 234-56-78");
      if (id === "kzPhone") {
        await expect(page.getByTestId("kzPhone-state")).toHaveAttribute("data-value", "+7 (701) 234-56-78");
      }
    });
  }
}
