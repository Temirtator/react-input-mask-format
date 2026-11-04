const assert = require("node:assert/strict");
const InputMask = require("react-input-mask-format").default;
const { useMask } = require("react-input-mask-format");
const { kzPhone } = require("react-input-mask-format/presets");
const { isValidIin } = require("react-input-mask-format/validators");
const { formatNumber } = require("react-input-mask-format/number");
const { formatTime } = require("react-input-mask-format/time");
const { formatDate } = require("react-input-mask-format/date");
const { detectCardBrand } = require("react-input-mask-format/card");

assert.equal(typeof InputMask, "object");
assert.equal(typeof useMask, "function");
assert.equal(typeof kzPhone.mask, "string");
assert.equal(isValidIin("123"), false);
assert.equal(formatNumber("1234.5", { thousandSeparator: "," }), "1,234.5");
assert.equal(formatTime("0905"), "09:05");
assert.equal(formatDate("2024-05-12"), "12.05.2024");
assert.equal(detectCardBrand("4111"), "visa");
console.log("cjs ok");
