import type { Locator, Page } from "@playwright/test";

async function copyToClipboard(page: Page, text: string): Promise<void> {
  const scratch = page.getByTestId("scratch");
  await scratch.click();
  await scratch.fill(text);
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+c");
}

export async function pasteInto(page: Page, target: Locator, text: string): Promise<void> {
  await copyToClipboard(page, text);
  await target.click();
  await page.waitForTimeout(50);
  await page.keyboard.press("ControlOrMeta+v");
}

export async function pasteOver(page: Page, target: Locator, text: string): Promise<void> {
  await copyToClipboard(page, text);
  await target.click();
  await page.waitForTimeout(50);
  await page.keyboard.press("ControlOrMeta+a");
  await page.waitForTimeout(50);
  await page.keyboard.press("ControlOrMeta+v");
}

export async function autofillFocused(target: Locator, text: string): Promise<void> {
  await target.click();
  await target.page().waitForTimeout(50);
  await target.fill(text);
}

export async function autofillUnfocused(target: Locator, text: string): Promise<void> {
  await target.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new InputEvent("input", { inputType: "insertReplacementText", bubbles: true }));
  }, text);
}
