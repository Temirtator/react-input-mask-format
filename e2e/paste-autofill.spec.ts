import { test, expect, type Locator, type Page } from "@playwright/test";
import { pasteInto, pasteOver } from "./helpers";

type Field = {
  testid: string;
  tab?: "ru" | "uz" | "kg";
  input: string;
  expected: string;
};

const kzPhone: Field = { testid: "kzPhone", input: "+7 701 123 45 67", expected: "+7 (701) 123-45-67" };
const usemask: Field = { testid: "usemask", input: "31.12.2024", expected: "31/12/2024" };

const pasteCases: Field[] = [
  kzPhone,
  { testid: "ruPhone", tab: "ru", input: "89123456789", expected: "+7 (912) 345-67-89" },
  { testid: "uzPhone", tab: "uz", input: "+998 90 123 45 67", expected: "+998 (90) 123-45-67" },
  { testid: "kgPhone", tab: "kg", input: "0555 12 34 56", expected: "+996 (555) 12-34-56" },
  { testid: "card", input: "4242 4242 4242 4242", expected: "4242 4242 4242 4242" },
  { testid: "iban", input: "kz86125kzt5004100100", expected: "KZ86 125K ZT50 0410 0100" },
  { testid: "date", input: "31.12.2024", expected: "31/12/2024" },
  usemask
];

async function openField(page: Page, field: Field): Promise<Locator> {
  await page.goto("/");
  if (field.tab) {
    await page.getByTestId(`country-${field.tab}`).click();
  }
  return page.getByTestId(field.testid);
}

async function expectState(page: Page, field: Field, expected: string): Promise<void> {
  if (field.testid === "usemask") {
    await expect(page.getByTestId("usemask-readout")).toHaveText(expected);
  } else if (field.testid !== "date") {
    await expect(page.getByTestId(`${field.testid}-state`)).toHaveAttribute("data-value", expected);
  }
}

test("clipboard round trip through the scratch field", async ({ page }) => {
  await page.goto("/");
  const scratch = page.getByTestId("scratch");
  await scratch.click();
  await scratch.fill("abc");
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("ControlOrMeta+c");
  await scratch.fill("");
  await page.keyboard.press("ControlOrMeta+v");
  await expect(scratch).toHaveValue("abc");
});

test.describe("paste into an empty field", () => {
  for (const field of pasteCases) {
    test(field.testid, async ({ page }) => {
      const input = await openField(page, field);
      await pasteInto(page, input, field.input);
      await expect(input).toHaveValue(field.expected);
      await expectState(page, field, field.expected);
    });
  }
});

test("paste into a partially filled kzPhone", async ({ page }) => {
  const input = await openField(page, kzPhone);
  await input.click();
  await input.pressSequentially("01");
  await expect(input).toHaveValue("+7 (701) ___-__-__");
  await pasteInto(page, input, "1234567");
  await expect(input).toHaveValue("+7 (701) 123-45-67");
  await expectState(page, kzPhone, "+7 (701) 123-45-67");
});

test.describe("paste over a selection", () => {
  test("kzPhone", async ({ page }) => {
    const input = await openField(page, kzPhone);
    await input.click();
    await input.pressSequentially("011234567");
    await expect(input).toHaveValue("+7 (701) 123-45-67");
    await pasteOver(page, input, "+7 777 987 65 43");
    await expect(input).toHaveValue("+7 (777) 987-65-43");
    await expectState(page, kzPhone, "+7 (777) 987-65-43");
  });

  test("usemask", async ({ page }) => {
    const input = await openField(page, usemask);
    await input.click();
    await input.pressSequentially("31122024");
    await expect(input).toHaveValue("31/12/2024");
    await pasteOver(page, input, "01.02.2003");
    await expect(input).toHaveValue("01/02/2003");
    await expectState(page, usemask, "01/02/2003");
  });
});
