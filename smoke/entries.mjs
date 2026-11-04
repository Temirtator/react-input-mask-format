import assert from "node:assert/strict";
import InputMask, { useMask } from "react-input-mask-format";
import { kzPhone } from "react-input-mask-format/presets";
import { isValidIin } from "react-input-mask-format/validators";
import { NumberFormat, formatNumber } from "react-input-mask-format/number";
import { TimeFormat, formatTime } from "react-input-mask-format/time";
import { DateFormat, formatDate } from "react-input-mask-format/date";
import { CardNumberFormat, detectCardBrand } from "react-input-mask-format/card";

assert.equal(typeof InputMask, "object");
assert.equal(typeof useMask, "function");
assert.equal(typeof kzPhone.mask, "string");
assert.equal(isValidIin("123"), false);
for (const component of [NumberFormat, TimeFormat, DateFormat, CardNumberFormat]) assert.equal(typeof component, "object");
assert.equal(formatNumber("1234.5", { thousandSeparator: "," }), "1,234.5");
assert.equal(formatTime("0905"), "09:05");
assert.equal(formatDate("2024-05-12"), "12.05.2024");
assert.equal(detectCardBrand("4111"), "visa");
console.log("esm ok");
