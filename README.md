# react-input-mask-format

[![npm version](https://img.shields.io/npm/v/react-input-mask-format.svg)](https://www.npmjs.com/package/react-input-mask-format)
[![npm downloads](https://img.shields.io/npm/dm/react-input-mask-format.svg)](https://www.npmjs.com/package/react-input-mask-format)
[![CI](https://github.com/Temirtator/react-input-mask-format/actions/workflows/ci.yml/badge.svg)](https://github.com/Temirtator/react-input-mask-format/actions/workflows/ci.yml)

General-purpose input masking for React — dates, phone numbers, cards, custom
tokens, and a growing set of ready-made country packs (Kazakhstan, Russia, Uzbekistan).
Made with attention to UX.

A maintained fork of [react-input-mask](https://github.com/sanniassin/react-input-mask).

**Live demo:** https://temirtator.github.io/react-input-mask-format/

## What's new in 2.5

- Uzbekistan country pack in `react-input-mask-format/presets` — phone, PINFL, INN, bank account, MFO, car plates (individual and company), postal code, passport / ID card, see [Presets](#presets)
- `isValidUzPinfl` (official 7-3-1 checksum + embedded birth date) and `isValidUzInn` (format) in `react-input-mask-format/validators`, see [Validators](#validators)

All additive — no migration needed.

### 2.4

- Russia country pack in `react-input-mask-format/presets` — phone, INN, SNILS, OGRN/OGRNIP, KPP, BIK, bank account, IBAN, car plate, postal code, passport, see [Presets](#presets)
- Russian validators in `react-input-mask-format/validators` — INN, SNILS, OGRN/OGRNIP, bank account key (with BIK), IBAN, plate, KPP/BIK format, see [Validators](#validators)

### 2.3

- `react-input-mask-format/time` — HH:MM (24h) masked input with clamping, see [Time](#time--react-input-mask-formattime)

### 2.2

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

Presets are a country-agnostic system with country packs for Kazakhstan, Russia and Uzbekistan —
PRs adding other countries are welcome.

### Generic

| export | mask | example |
| --- | --- | --- |
| `card` | `9999 9999 9999 9999` | `4242 4242 4242 4242` |

### Kazakhstan

| export | mask | example |
| --- | --- | --- |
| `kzPhone` | `+7 (799) 999-99-99` | `+7 (701) 234-56-78` |
| `kzIin` | `999999999999` | `901010123458` |
| `kzBin` | `999999999999` | `150340004984` |
| `kzIban` | `KZ99 999* **** **** ****` (uppercase) | `KZ86 125K ZT50 0410 0100` |
| `kzPlate` | `123 ABC 02` (letters `ABCEHKMNOPTXY`, uppercase) | `123 ABC 02` |
| `kzPostal` | `999999` | `050000` |

### Russia

| export | mask | example |
| --- | --- | --- |
| `ruPhone` | `+7 (999) 999-99-99` (first digit 3/4/8/9) | `+7 (912) 345-67-89` |
| `ruInnPerson` | `999999999999` | `500100732259` |
| `ruInnCompany` | `9999999999` | `7707083893` |
| `ruSnils` | `999-999-999 99` | `112-233-445 95` |
| `ruOgrn` | `9999999999999` | `1027700132195` |
| `ruOgrnip` | `999999999999999` | `304500116000157` |
| `ruKpp` | `9999**999` (uppercase) | `7707AB001` |
| `ruBik` | `999999999` | `044525225` |
| `ruAccount` | `99999 999 9 9999 9999999` | `40817 810 5 3809 1310419` |
| `ruIban` | `RU99 9999 9999 9999 99** **** **** **** *` (uppercase) | `RU03 0445 2522 5408 1781 0538 0913 1041 9` |
| `ruPlate` | `А 999 АА 999` (letters `АВЕКМНОРСТУХ`) | `А 123 ВС 77` |
| `ruPostal` | `999999` | `101000` |
| `ruPassport` | `9999 999999` | `4506 123456` |

Notes:
- `ruPlate` accepts Latin look-alikes (`A B E K M H O P C T Y X`) and stores **Cyrillic**.
  Regions are 2 or 3 digits, so the preset has no placeholder — check completeness with `isValidRuPlate`.
- `ruPlate` covers type-1 (passenger car) plates only — not taxi, trailer, motorcycle, or diplomatic plates.
- Because the region length varies, `ruPlate` has no placeholder; deleting a character in the middle shifts the rest of the plate and may drop it — clear and retype the plate to fix a typo.
- `ruPhone` expects the 10-digit national number. A number typed with the domestic
  trunk prefix `8` (`8 912 …`) is read as area code `891`; `+7…` and `7…` input is handled.

### Uzbekistan

| export | mask | example |
| --- | --- | --- |
| `uzPhone` | `+998 (99) 999-99-99` | `+998 (90) 123-45-67` |
| `uzPinfl` | `99999999999999` | `31210932040247` |
| `uzInn` | `999999999` | `207086151` |
| `uzAccount` | `99999 999 9 99999999 999` | `20208 000 9 00600293 001` |
| `uzMfo` | `99999` | `00417` |
| `uzPlate` | `99 a 999 aa` (uppercase) | `01 A 123 BC` |
| `uzPlateCompany` | `99 999 aaa` (uppercase) | `01 123 ABC` |
| `uzPostal` | `999999` | `100123` |
| `uzPassport` | `aa9999999` (uppercase) | `AA1234567` |

Notes:
- `uzPhone` takes the 9-digit national number (`90 123 45 67`): type or paste it without the country code.
  Known limitations (a core fix is planned):
  - pasting an international number (`+998 90 123 45 67`, `998901234567`) or a domestic `8 90 …` number
    misreads the prefix — e.g. `+998 90 123 45 67` becomes `+998 (99) 890-12-34`;
  - when setting `value` programmatically, pass the international form (`+998901234567`) or the formatted
    value — bare national digits starting with `9` are misread (`"901234567"` renders `+998 (01) 234-56-7_`).
    Store phones as `+998…`.
- In the table the mask is shown as users see it; in source the country-code 9s are escaped
  (`"+\\9\\98 (99) 999-99-99"`), because `9` is the digit token.
- `uzPlate` / `uzPlateCompany` cover the standard individual and company plates;
  personalised plates (since 2026), diplomatic and foreign plates are not supported.
- Uzbekistan is not in the IBAN registry; bank accounts are 20 digits plus a 5-digit MFO bank code.

## Validators

Optional checksum validators, separate entry point, zero-deps. Accept raw or formatted
input; return `false` on empty/invalid.

```jsx
import {
  isValidIin, isValidBin, isValidKzIban, luhn,
  isValidRuInn, isValidRuSnils, isValidRuOgrn, isValidRuOgrnip,
  isValidRuKpp, isValidRuBik, isValidRuAccount, isValidRuIban, isValidRuPlate,
  isValidUzPinfl, isValidUzInn
} from "react-input-mask-format/validators";

isValidIin("901010123458");                          // KZ IIN/BIN mod-11 checksum
isValidKzIban("KZ86 125K ZT50 0410 0100");           // ISO 7064 MOD-97
luhn("4242 4242 4242 4242");                         // card Luhn

isValidRuInn("7707083893");                          // 10 (company) or 12 (person) digits
isValidRuSnils("112-233-445 95");                    // mod-101; ≤ 001-001-998 not checked
isValidRuOgrn("1027700132195");                      // OGRN (13) · isValidRuOgrnip — 15
isValidRuAccount("40817810538091310419", "044525225"); // account control key with BIK
isValidRuAccount("03100643000000018500", "017003983"); // treasury 03… accounts: structure only (no control key)
isValidRuIban("RU03 0445 2522 5408 1781 0538 0913 1041 9");
isValidRuPlate("А 123 ВС 77");                       // region 2–3 digits, Latin look-alikes OK
isValidRuKpp("7707AB001"); isValidRuBik("044525225"); // format only (no checksum exists)

isValidUzPinfl("31210932040247");                    // PINFL: 7-3-1 checksum + birth date
isValidUzInn("207086151");                           // format only (checksum not published)
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

## Time — `react-input-mask-format/time`

A separate, tree-shakeable entry for formatting times in 24-hour format (HH:MM).

```tsx
import { TimeFormat, useTimeFormat, formatTime } from "react-input-mask-format/time";

// controlled component
<TimeFormat value={time} onValueChange={(v) => setTime(v.value)} />

// bring-your-own input (e.g. a design-system Input)
const ref = useTimeFormat({ onValueChange: (v) => setTime(v.value) });
<input ref={ref} />

formatTime("2999"); // "23:59"
```

`onValueChange` receives `{ value, formattedValue, hours, minutes }`:

```txt
typing "1234"  →  value "12:34"  formattedValue "12:34"  hours 12  minutes 34
typing "12"    →  value ""       formattedValue "12:"     hours 12  minutes undefined
```

`value` remains empty until both hours and minutes are complete. The canonical
`value` always uses `:` as the separator, regardless of the display `separator`
option.

**Clamping**: When hours are complete (two digits), they're clamped to ≤23.
When minutes are complete, they're clamped to ≤59. A single digit is never
clamped.

Because an incomplete time has an empty canonical `value`, a controlled parent
that resets `value` to `""` won't visibly clear a partially-typed field; to
force-clear it, remount the input with a changed React `key`.

Options: `separator` (default `:`).

There is also a ref hook and the pure helpers:

```tsx
import { useTimeFormat, formatTime, parseTime } from "react-input-mask-format/time";

const ref = useTimeFormat({ separator: ":" });
// <input ref={ref} />

formatTime("2999", { separator: ":" }); // "23:59"
parseTime("14:30");                      // { value: "14:30", formattedValue: "14:30", hours: 14, minutes: 30 }
```

**Reserved for a later minor release**: seconds (HH:MM:SS) and 12-hour format
with AM/PM.

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
