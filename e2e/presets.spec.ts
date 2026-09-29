import { test, expect } from "@playwright/test";

test("kzIban uppercases typed account letters", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("iban");
  await input.click();
  await input.pressSequentially("86125kzt5004100100");
  await expect(input).toHaveValue("KZ86 125K ZT50 0410 0100");
});

test("kzPlate uppercases and restricts letters", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("plate");
  await input.click();
  await input.pressSequentially("123abc02");
  await expect(input).toHaveValue("123 ABC 02");
});

test("hex token accepts hex digits only", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("hex");
  await input.click();
  await input.pressSequentially("1ag2");
  await expect(input).toHaveValue("1a2___"); // 'g' rejected; remaining positions filled with placeholder
});

test("country switcher shows the Russia pack", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-ru").click();
  await expect(page.getByTestId("ruPhone")).toBeVisible();
  await expect(page.getByTestId("iin")).toHaveCount(0);
});

test("ruPlate converts Latin typing to Cyrillic and keeps a 2-digit region on blur", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-ru").click();
  const input = page.getByTestId("ruPlate");
  await input.click();
  await input.pressSequentially("a123bc77");
  await expect(input).toHaveValue("А 123 ВС 77");
  await page.getByTestId("ruPostal").click();
  await expect(input).toHaveValue("А 123 ВС 77");
});

test("ruSnils formats typed digits", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-ru").click();
  const input = page.getByTestId("ruSnils");
  await input.click();
  await input.pressSequentially("11223344595");
  await expect(input).toHaveValue("112-233-445 95");
});

test("uzPhone formats a typed national number", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-uz").click();
  const input = page.getByTestId("uzPhone");
  await input.click();
  await input.pressSequentially("901234567");
  await expect(input).toHaveValue("+998 (90) 123-45-67");
});

test("uzPlate uppercases typed letters", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-uz").click();
  const input = page.getByTestId("uzPlate");
  await input.click();
  await input.pressSequentially("01a123bc");
  await expect(input).toHaveValue("01 A 123 BC");
});
