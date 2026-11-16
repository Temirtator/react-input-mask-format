import { test, expect, Page } from "@playwright/test";

async function compose(page: Page, steps: string[], commit: string): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  for (const text of steps) {
    await cdp.send("Input.imeSetComposition", { text, selectionStart: text.length, selectionEnd: text.length });
  }
  await cdp.send("Input.insertText", { text: commit });
}

const cases: [string, string[], string, string][] = [
  ["date", ["1", "12"], "123", "12/3_/____"],
  ["upper", ["k", "kz", "kzb"], "kzbn", "KZBN__"],
  ["usemask", ["1", "12"], "123", "12/3_/____"],
  ["kzPhone", ["0", "01"], "012", "+7 (701) 2__-__-__"],
  ["kzPhone-hook", ["0", "01"], "012", "+7 (701) 2__-__-__"],
  ["date-format", ["1", "12"], "123", "12.3"],
  ["date-format-hook", ["2", "20"], "2024", "2024-"],
  ["time", ["0", "09"], "093", "09:3"],
  ["time-hook", ["0", "09"], "093", "09:3"],
  ["currency", ["1", "12"], "1234", "$ 1,234"],
  ["numeric-hook", ["1", "12"], "1234", "1 234"],
  ["card-number", ["4", "41"], "41111", "4111 1"]
];

test.describe("IME composition", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "IME emulation needs the Chrome DevTools Protocol");

  for (const [id, steps, commit, expected] of cases) {
    test(`${id}: the committed text is masked once`, async ({ page }) => {
      await page.goto("/");
      const input = page.getByTestId(id);
      await input.click();
      await page.waitForTimeout(100);
      await compose(page, steps, commit);
      await expect(input).toHaveValue(expected);
      if (id === "kzPhone") {
        await expect(page.getByTestId("kzPhone-state")).toHaveAttribute("data-value", expected);
      }
      if (id === "usemask") {
        await expect(page.getByTestId("usemask-readout")).toHaveText(expected);
      }
    });
  }

  test("typing continues after a composition", async ({ page }) => {
    await page.goto("/");
    const input = page.getByTestId("date");
    await input.click();
    await page.waitForTimeout(100);
    await compose(page, ["1"], "12");
    await page.keyboard.type("052024");
    await expect(input).toHaveValue("12/05/2024");
  });
});
