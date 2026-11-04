import { test, expect } from "@playwright/test";
import { autofillUnfocused } from "./helpers";

const cases = [
  { id: "kzPhone", filled: "+77012345678", expected: "+7 (701) 234-56-78" },
  { id: "usemask", filled: "12/05/2024", expected: "12/05/2024" },
  { id: "date", filled: "12/05/2024", expected: "12/05/2024" }
];

for (const c of cases) {
  for (const caret of [5, "end"] as const) {
    test(`${c.id}: autofill into a field the user left empty (caret ${caret})`, async ({ page }) => {
      await page.goto("/");
      const input = page.getByTestId(c.id);
      await input.click();
      await page.waitForTimeout(50);
      await input.evaluate((el: HTMLInputElement, at) => {
        const position = at === "end" ? el.value.length : (at as number);
        el.setSelectionRange(position, position);
      }, caret);
      await page.waitForTimeout(50);
      await page.getByTestId("scratch").click();
      await expect(input).toHaveValue("");
      await autofillUnfocused(input, c.filled);
      await expect(input).toHaveValue(c.expected);
    });
  }
}
