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
  await expect(input).toHaveValue("А 123 ВС 77_");
  await page.getByTestId("ruPostal").click();
  await expect(input).toHaveValue("А 123 ВС 77_");
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

test("kgPhone skips a typed domestic leading 0", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-kg").click();
  const input = page.getByTestId("kgPhone");
  await input.click();
  await input.pressSequentially("0555123456");
  await expect(input).toHaveValue("+996 (555) 12-34-56");
});

test("kgPassport uppercases the ID card series", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-kg").click();
  const input = page.getByTestId("kgPassport");
  await input.click();
  await input.pressSequentially("id1234567");
  await expect(input).toHaveValue("ID1234567");
});

test("byPhone skips a typed domestic 8 0 prefix", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-by").click();
  const input = page.getByTestId("byPhone");
  await input.click();
  await input.pressSequentially("80291234567");
  await expect(input).toHaveValue("+375 (29) 123-45-67");
});

test("byPersonalId turns typed Cyrillic into Latin", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-by").click();
  const input = page.getByTestId("byPersonalId");
  await input.click();
  await input.pressSequentially("7000000а000рв1");
  await expect(input).toHaveValue("7000000A000PB1");
});

test("tjPhone formats a typed national number", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-tj").click();
  const input = page.getByTestId("tjPhone");
  await input.click();
  await input.pressSequentially("931234567");
  await expect(input).toHaveValue("+992 (93) 123-45-67");
});

test("amPhone skips a typed domestic leading 0", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-am").click();
  const input = page.getByTestId("amPhone");
  await input.click();
  await input.pressSequentially("077123456");
  await expect(input).toHaveValue("+374 (77) 12-34-56");
});

test("azPhone skips a typed domestic leading 0", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-az").click();
  const input = page.getByTestId("azPhone");
  await input.click();
  await input.pressSequentially("0501234567");
  await expect(input).toHaveValue("+994 (50) 123-45-67");
});

test("azFin uppercases and turns a typed O into zero", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("country-az").click();
  const input = page.getByTestId("azFin");
  await input.click();
  await input.pressSequentially("5vbkovr");
  await expect(input).toHaveValue("5VBK0VR");
});

test("kzPhone select all + retype with the country code", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("kzPhone");
  await input.click();
  await input.pressSequentially("7011234567");
  await input.press("ControlOrMeta+a");
  // the mask tracks the selection once per animation frame
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await input.pressSequentially("77779876543");
  await expect(input).toHaveValue("+7 (777) 987-65-43");
});

test("vin uppercases, maps O to 0 and Cyrillic to Latin", async ({ page }) => {
  await page.goto("/");
  const input = page.getByTestId("vin");
  await input.click();
  await input.pressSequentially("1hgcm8263oa004352");
  await expect(input).toHaveValue("1HGCM82630A004352");
  await expect(page.getByTestId("vin-state")).toHaveAttribute("data-value", "1HGCM82630A004352");
});
