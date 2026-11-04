const React = require("react");
const { renderToString } = require("react-dom/server");
const InputMask = require("react-input-mask-format").default;
const { kzPhone } = require("react-input-mask-format/presets");
const { NumberFormat } = require("react-input-mask-format/number");
const { TimeFormat } = require("react-input-mask-format/time");
const { DateFormat } = require("react-input-mask-format/date");
const { CardNumberFormat, CardExpiryFormat, CardCvcFormat } = require("react-input-mask-format/card");

const errors = [];
console.error = (...args) => errors.push(args.map(String).join(" "));

const html = renderToString(
  React.createElement(
    "form",
    null,
    React.createElement(InputMask, { ...kzPhone, defaultValue: "7011234567" }),
    React.createElement(NumberFormat, { value: "1234.5", thousandSeparator: "," }),
    React.createElement(TimeFormat, { defaultValue: "09:05" }),
    React.createElement(DateFormat, { defaultValue: "2024-05-12" }),
    React.createElement(CardNumberFormat, { defaultValue: "4111111111111111" }),
    React.createElement(CardExpiryFormat, { defaultValue: "12/26" }),
    React.createElement(CardCvcFormat, { defaultValue: "123" })
  )
);

for (const text of ["+7 (701) 123-45-67", "1,234.5", "09:05", "12.05.2024", "4111 1111 1111 1111", "12/26", "123"]) {
  if (!html.includes(text)) errors.push(`missing ${text}`);
}
if (errors.length > 0) {
  process.stderr.write(`React ${React.version}:\n${errors.join("\n")}\n`);
  process.exit(1);
}
console.log(`ssr ok (React ${React.version})`);
