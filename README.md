# react-input-mask-format

[![npm version](https://img.shields.io/npm/v/react-input-mask-format.svg)](https://www.npmjs.com/package/react-input-mask-format)
[![npm downloads](https://img.shields.io/npm/dm/react-input-mask-format.svg)](https://www.npmjs.com/package/react-input-mask-format)
[![CI](https://github.com/Temirtator/react-input-mask-format/actions/workflows/ci.yml/badge.svg)](https://github.com/Temirtator/react-input-mask-format/actions/workflows/ci.yml)

General-purpose input masking for React — dates, phone numbers, cards, custom
tokens, and a growing set of ready-made country packs (Kazakhstan ships first).
Made with attention to UX.

A maintained fork of [react-input-mask](https://github.com/sanniassin/react-input-mask).

## What's new in 2.2

- `useMask` hook — mask your own `<input>` with no wrapper component, see [useMask hook](#usemask-hook)
- `react-input-mask-format/number` — numeric & currency masking, a lightweight `react-number-format` alternative, see [Numeric & currency](#numeric--currency--react-input-mask-formatnumber)

### 2.1

- `transform` prop (`uppercase` / `lowercase` / custom) — see [transform](#transform)
- Custom tokens via RegExp `formatChars` + shipped `extendedFormatChars` (`A`, `Я`, `#`)
- `react-input-mask-format/presets` — `card` + Kazakhstan pack (phone, IIN, BIN, IBAN, plate, postal)
- `react-input-mask-format/validators` — `isValidIin`, `isValidBin`, `isValidKzIban`, `luhn`

All additive — no migration needed.

## Why this fork

The original `react-input-mask` has been unmaintained since 2021. This fork is:

- **React 16.8 – 19 compatible** — no `defaultProps`, no `findDOMNode`, StrictMode-safe
- **TypeScript-first** — types generated from source
- **Modern packaging** — ESM + CJS, `exports` map, tree-shakable
- **Zero runtime dependencies**
- **Custom `children` support restored** — passing a component as children
  (e.g. to reuse another UI library's input) was broken in every release
  since v1.0.x; it works again here
- **Drop-in compatible** with both `react-input-mask` v2 (`maskChar`, `formatChars`,
  `beforeMaskedValueChange`) and v3-alpha (`maskPlaceholder`, `beforeMaskedStateChange`) APIs

## Installation

```
npm install react-input-mask-format
```

Requires React 16.8.0 or later.

## Usage

```jsx
import InputMask from "react-input-mask-format";

function DateInput(props) {
  return <InputMask mask="99/99/9999" onChange={props.onChange} value={props.value} />;
}
```

## Properties

|                            Name                            |                Type                | Default | Description |
| :---------------------------------------------------------: | :--------------------------------: | :-----: | :--- |
|                    **[`mask`](#mask)**                     | `{String\|Array<String, RegExp>}`  |         | Mask format |
|                    **[`transform`](#transform)**                    | `{"uppercase"\|"lowercase"\|Function}` |         | Normalize each entered character before it's tested against the mask |
| **[`formatChars`](#custom-tokens-formatchars-and-extendedformatchars)** | `{Object<String, RegExp>}` |         | Custom mask tokens beyond the default `9`, `a`, `*` |
|          **[`maskPlaceholder`](#maskplaceholder)**          |             `{String}`             |   `_`   | Placeholder to cover unfilled parts of the mask |
|           **[`alwaysShowMask`](#alwaysshowmask)**           |            `{Boolean}`             | `false` | Whether mask prefix and placeholder should be displayed when input is empty and has no focus |
| **[`beforeMaskedStateChange`](#beforemaskedstatechange)** |            `{Function}`            |         | Function to modify value and selection before applying mask |
|                **[`children`](#children)**                 |          `{ReactElement}`          |         | Custom render function for integration with other input components |

### `mask`

Mask format. Can be either a string or array of characters and regular expressions.

```jsx
<InputMask mask="99/99/99" />
```

Simple masks can be defined as strings. The following characters will define mask format:

| Character | Allowed input |
| :-------: | :-----------: |
|     9     |      0-9      |
|     a     |    a-z, A-Z   |
|     *     | 0-9, a-z, A-Z |

Any format character can be escaped with a backslash.

More complex masks can be defined as an array of regular expressions and constant characters.

```jsx
// Canadian postal code mask
const firstLetter = /(?!.*[DFIOQU])[A-VXY]/i;
const letter = /(?!.*[DFIOQU])[A-Z]/i;
const digit = /[0-9]/;
const mask = [firstLetter, digit, letter, " ", digit, letter, digit];
return <InputMask mask={mask} />;
```

### `transform`

Normalize every entered character. Runs before the mask test, so an uppercase-only
class accepts lowercase typing; runs before `beforeMaskedStateChange`.

```jsx
<InputMask mask="aaaaaa" transform="uppercase" />           // "abc" → "ABC"
<InputMask mask={[/[A-Z]/, /[A-Z]/]} transform="uppercase" />
<InputMask mask="9a9a" transform={(char, position) => char} />
```

Values: `"uppercase"`, `"lowercase"`, or `(char, position) => char` (must be pure).

### Custom tokens (`formatChars`) and `extendedFormatChars`

Define your own mask tokens by mapping a character to a `RegExp`:

```jsx
import InputMask, { extendedFormatChars } from "react-input-mask-format";

// roll your own
<InputMask mask="ww-ww" formatChars={{ w: /[a-z]/ }} />

// or use the shipped extended set: A (uppercase), Я (Cyrillic incl. Kazakh), # (hex)
<InputMask mask="AAA-###" formatChars={extendedFormatChars} />
```

The default tokens (`9`, `a`, `*`) are unchanged. Passing string values (`{ w: "[a-z]" }`)
still works but is deprecated — pass `RegExp` values.

## Presets

Ready-made mask configs. Import what you need and spread it — tree-shakeable, and the
core bundle carries none of it.

```jsx
import InputMask from "react-input-mask-format";
import { kzPhone, kzIban } from "react-input-mask-format/presets";

<InputMask {...kzPhone} value={phone} onChange={onChange} />
<InputMask {...kzIban} value={iban} onChange={onChange} />
```

Presets are a country-agnostic system; Kazakhstan is the first (flagship) country pack —
PRs adding other countries are welcome.

| export | mask | example |
| --- | --- | --- |
| `card` | `9999 9999 9999 9999` | `4242 4242 4242 4242` |
| `kzPhone` | `+7 (799) 999-99-99` | `+7 (701) 234-56-78` |
| `kzIin` | `999999999999` | `901010123458` |
| `kzBin` | `999999999999` | `150340004984` |
| `kzIban` | `KZ99 999* **** **** ****` (uppercase) | `KZ86 125K ZT50 0410 0100` |
| `kzPlate` | `123 ABC 02` (letters `ABCEHKMNOPTXY`, uppercase) | `123 ABC 02` |
| `kzPostal` | `999999` | `050000` |

## Validators

Optional checksum validators, separate entry point, zero-deps. Accept raw or formatted
input; return `false` on empty/invalid.

```jsx
import { isValidIin, isValidBin, isValidKzIban, luhn } from "react-input-mask-format/validators";

isValidIin("901010123458");                 // KZ IIN/BIN mod-11 checksum
isValidKzIban("KZ86 125K ZT50 0410 0100");  // ISO 7064 MOD-97
luhn("4242 4242 4242 4242");                // card Luhn
```

## `useMask` hook

Mask your own `<input>` with no wrapper component. `useMask` returns a ref
callback:

```tsx
import { useMask } from "react-input-mask-format";

function Phone() {
  const ref = useMask({ mask: "+7 (999) 999-99-99", maskPlaceholder: "_" });
  return <input ref={ref} name="phone" />;
}
```

`useMask` is **uncontrolled**: attach it to an input you don't drive with a
React `value` prop, and read the masked value through your own `onChange` (it
fires with the masked value) or on form submit. For a controlled component,
use `<InputMask>`.

Options: `mask`, `maskPlaceholder`, `alwaysShowMask`, `formatChars`,
`transform`, `beforeMaskedStateChange`.

## Numeric & currency — `react-input-mask-format/number`

A separate, tree-shakeable entry for formatting numbers, currency, and
percentages. Prop names match `react-number-format`, so migration is mostly a
find-and-replace of the import.

```tsx
import { NumberFormat } from "react-input-mask-format/number";

function Amount() {
  const [value, setValue] = React.useState<number>();
  return (
    <NumberFormat
      value={value ?? ""}
      onValueChange={({ floatValue }) => setValue(floatValue)}
      thousandSeparator="," decimalScale={2} fixedDecimalScale prefix="$ "
      allowNegative
    />
  );
}
```

`onValueChange` receives `{ value, formattedValue, floatValue }`:

```txt
typing "1234.5"  →  value "1234.5"  formattedValue "$ 1,234.50"  floatValue 1234.5
```

Options: `thousandSeparator` (`true` → `,`, or a custom string),
`decimalSeparator` (default `.`), `decimalScale` (truncates, no rounding),
`fixedDecimalScale`, `prefix`, `suffix`, `allowNegative` (default `true`),
`allowLeadingZeros`, and `isAllowed(values) => boolean` (reject an edit, e.g.
for min/max).

There is also a ref hook and the pure helpers:

```tsx
import { useNumberFormat, formatNumber, parseNumber } from "react-input-mask-format/number";

const ref = useNumberFormat({ thousandSeparator: " ", decimalScale: 2, prefix: "$ " });
// <input ref={ref} />

formatNumber(1234.5, { thousandSeparator: ",", decimalScale: 2, fixedDecimalScale: true }); // "1,234.50"
```

### Migrating from react-number-format

`NumberFormat`'s props (`thousandSeparator`, `decimalSeparator`, `decimalScale`,
`fixedDecimalScale`, `prefix`, `suffix`, `allowNegative`, `allowLeadingZeros`,
`isAllowed`, `onValueChange`) mirror `react-number-format`'s `NumericFormat`.
The main differences: `decimalScale` **truncates** rather than rounds while
typing, and this package ships a single `NumberFormat` (no separate
`PatternFormat` — use the mask engine / `<InputMask>` for pattern masks).

### `maskPlaceholder`

```jsx
// Will be rendered as 12/--/--
<InputMask mask="99/99/99" maskPlaceholder="-" value="12" />

// Will be rendered as 12/mm/yy
<InputMask mask="99/99/99" maskPlaceholder="dd/mm/yy" value="12" />

// Will be rendered as 12/
<InputMask mask="99/99/99" maskPlaceholder={null} value="12" />
```

Character or string to cover unfilled parts of the mask. Default character is "\_". If set to `null` or empty string, unfilled parts will be empty as in a regular input.

### `alwaysShowMask`

If enabled, mask prefix and placeholder will be displayed even when input is empty and has no focus.

### `beforeMaskedStateChange`

In case you need to customize masking behavior, you can provide `beforeMaskedStateChange` function to change masked value and cursor position before it's applied to the input.

It receives an object with `previousState`, `currentState` and `nextState` properties. Each state is an object with `value` and `selection` properties where `value` is a string and `selection` is an object containing `start` and `end` positions of the selection.

1. **previousState:** Input state before change. Only defined on `change` event.
2. **currentState:** Current raw input state. Not defined during component render.
3. **nextState:** Input state with applied mask. Contains `value` and `selection` fields.

Selection positions will be `null` if input isn't focused and during rendering.

`beforeMaskedStateChange` must return a new state with `value` and `selection`.

```jsx
// Trim trailing slashes
function beforeMaskedStateChange({ nextState }) {
  let { value } = nextState;
  if (value.endsWith("/")) {
    value = value.slice(0, -1);
  }

  return {
    ...nextState,
    value
  };
}

return <InputMask mask="99/99/99" maskPlaceholder={null} beforeMaskedStateChange={beforeMaskedStateChange} />;
```

Please note that `beforeMaskedStateChange` executes more often than `onChange` and must be pure.

### `children`

To use another component instead of a regular `<input />`, provide it as children. The following properties, if used, should always be defined on the `InputMask` component itself: `onChange`, `onMouseDown`, `onFocus`, `onBlur`, `value`, `disabled`, `readOnly`.

The child component must forward its ref to the underlying `<input>` DOM node (or to a wrapper element that contains one, e.g. a Material-style input with an internal `<input>`) so `InputMask` can read and control its value and selection.

```jsx
import React from "react";
import InputMask from "react-input-mask-format";

const CustomInput = React.forwardRef((props, ref) => (
  <input ref={ref} {...props} style={{ borderColor: "rebeccapurple" }} />
));

// Will work fine
function Input(props) {
  return (
    <InputMask mask="99/99/9999" value={props.value} onChange={props.onChange}>
      <CustomInput />
    </InputMask>
  );
}

// Will throw an error because InputMask's and children's onChange props aren't the same
function InvalidInput(props) {
  return (
    <InputMask mask="99/99/9999" value={props.value}>
      <CustomInput onChange={props.onChange} />
    </InputMask>
  );
}
```

> **Note:** `InputMask` clones the child element and injects its own `ref`
> callback into it, so a `ref` placed directly on the child element will be
> replaced. Attach your ref to `<InputMask>` itself instead. The ref you attach
> to `<InputMask>` receives whatever node the child component forwards its ref to;
> if the child forwards to a wrapper element rather than the actual `<input>`,
> you get that wrapper (the library still finds the inner input internally for masking).

## Known Issues

### Autofill

Browser's autofill requires either empty value in input or value which exactly matches beginning of the autofilled value. I.e. autofilled value "+1 (555) 123-4567" will work with "+1" or "+1 (5", but won't work with "+1 (\_\_\_) \_\_\_-\_\_\_\_" or "1 (555)". There are several possible solutions:

1. Set `maskPlaceholder` to null and trim space after "+1" with `beforeMaskedStateChange` if no more digits are entered.
2. Apply mask only if value is not empty. In general, this is the most reliable solution because we can't be sure about formatting in autofilled value.
3. Use less formatting in the mask.

Please note that it might lead to worse user experience (should I enter +1 if input is empty?). You should choose what's more important to your users — smooth typing experience or autofill. Phone and ZIP code inputs are very likely to be autofilled and it's a good idea to care about it, while security confirmation code in two-factor authorization shouldn't care about autofill at all.

### Cypress tests

The following sequence could fail

```js
cy.get("input")
  .focus()
  .type("12345")
  .should("have.value", "12/34/5___"); // expected <input> to have value 12/34/5___, but the value was 23/45/____
```

Since [focus is not an action command](https://docs.cypress.io/api/commands/focus.html#Focus-is-not-an-action-command), it behaves differently than the real user interaction and, therefore, less reliable.

There is a few possible workarounds

```js
// Start typing without calling focus() explicitly.
// type() is an action command and focuses input anyway
cy.get("input")
  .type("12345")
  .should("have.value", "12/34/5___");

// Use click() instead of focus()
cy.get("input")
  .click()
  .type("12345")
  .should("have.value", "12/34/5___");

// Or wait a little after focus()
cy.get("input")
  .focus()
  .wait(50)
  .type("12345")
  .should("have.value", "12/34/5___");
```

## Migrating from react-input-mask

### From v2 (2.0.4 and earlier)

Your code keeps working as is — `maskChar`, `formatChars` and
`beforeMaskedValueChange` are supported as deprecated aliases (a one-time
console warning is emitted in development). Recommended renames:

| v2 | v2.x of this package |
| --- | --- |
| `maskChar="-"` | `maskPlaceholder="-"` |
| `maskChar={null}` | `maskPlaceholder={null}` |
| `formatChars={{ "#": "[0-9]" }}` | array mask: `mask={[/[0-9]/, …]}` (or keep `formatChars`) |
| `beforeMaskedValueChange={(newState, oldState, userInput, options) => …}` | `beforeMaskedStateChange={({ previousState, currentState, nextState }) => …}` |
| `inputRef={el => …}` | `ref` (standard forwarded ref) |
| `alwaysShowMask` | unchanged |
| custom `children` (e.g. wrapping another input library) | works if the child forwards its ref to the input (or a wrapper containing one) — see [children](#children); upstream v2 accepted any child via findDOMNode |

### From v3-alpha

API is identical — change the import to `react-input-mask-format` and you are done.
