# react-input-mask-format

[![npm version](https://img.shields.io/npm/v/react-input-mask-format.svg)](https://www.npmjs.com/package/react-input-mask-format)
[![npm downloads](https://img.shields.io/npm/dm/react-input-mask-format.svg)](https://www.npmjs.com/package/react-input-mask-format)
[![CI](https://github.com/Temirtator/react-input-mask-format/actions/workflows/ci.yml/badge.svg)](https://github.com/Temirtator/react-input-mask-format/actions/workflows/ci.yml)

Input masking for React — dates, phones, cards, custom tokens, numbers, time, and ready-made
country packs (Kazakhstan, Russia, Uzbekistan, Kyrgyzstan). A maintained fork of
[react-input-mask](https://github.com/sanniassin/react-input-mask).

**[Live demo](https://temirtator.github.io/react-input-mask-format/)** · **[Changelog](CHANGELOG.md)**

## Installation

```
npm install react-input-mask-format
```

Requires React 16.8 or later.

## Quick start

```jsx
import InputMask, { useMask } from "react-input-mask-format";
import { kzPhone } from "react-input-mask-format/presets";

// component
<InputMask mask="99/99/9999" value={value} onChange={onChange} />

// preset
<InputMask {...kzPhone} value={phone} onChange={onChange} />

// hook on your own <input>
const ref = useMask({ mask: "+7 (999) 999-99-99" });
<input ref={ref} />
```

## Why this fork

The original `react-input-mask` has been unmaintained since 2021. This fork is:

- **React 16.8 – 19 compatible** — no `defaultProps`, no `findDOMNode`, StrictMode-safe
- **TypeScript-first**, **zero runtime dependencies**, ESM + CJS, tree-shakable entry points
- **Drop-in compatible** with `react-input-mask` v2 and v3-alpha APIs ([migration](#migrating-from-react-input-mask))
- **Custom `children` work again** — broken upstream since v1.0.x

## Contents

- [Properties](#properties) · [`useMask`](#usemask-hook)
- [Presets](#presets) · [Masks with a fixed prefix](#masks-with-a-fixed-prefix) · [Validators](#validators)
- [Numbers & currency](#numbers--currency--react-input-mask-formatnumber) · [Time](#time--react-input-mask-formattime)
- [Known issues](#known-issues) · [Migration](#migration)

## Properties

| Name | Type | Default | Description |
| --- | --- | :---: | --- |
| [`mask`](#mask) | `string \| Array<string \| RegExp>` | | Mask format |
| [`maskPlaceholder`](#maskplaceholder) | `string \| null` | `_` | Fills unfilled parts of the mask |
| [`alwaysShowMask`](#alwaysshowmask) | `boolean` | `false` | Show the mask when the input is empty and unfocused |
| [`transform`](#transform) | `"uppercase" \| "lowercase" \| Function` | | Normalize each typed character before the mask test |
| [`formatChars`](#formatchars) | `Record<string, RegExp>` | | Custom tokens beyond `9`, `a`, `*` |
| [`beforeMaskedStateChange`](#beforemaskedstatechange) | `Function` | | Adjust value and selection before they are applied |
| [`children`](#children) | `ReactElement` | | Render another input component |

### `mask`

A string or an array of characters and regular expressions.

| Character | Allowed input |
| :---: | :---: |
| `9` | 0-9 |
| `a` | a-z, A-Z |
| `*` | 0-9, a-z, A-Z |

Escape a format character with a backslash (`"+\\9\\98 (99) 999-99-99"`). Array masks allow any per-position rule:

```jsx
// Canadian postal code
const firstLetter = /(?!.*[DFIOQU])[A-VXY]/i;
const letter = /(?!.*[DFIOQU])[A-Z]/i;
const digit = /[0-9]/;
<InputMask mask={[firstLetter, digit, letter, " ", digit, letter, digit]} />
```

### `maskPlaceholder`

```jsx
<InputMask mask="99/99/99" maskPlaceholder="-" value="12" />        // 12/--/--
<InputMask mask="99/99/99" maskPlaceholder="dd/mm/yy" value="12" /> // 12/mm/yy
<InputMask mask="99/99/99" maskPlaceholder={null} value="12" />     // 12/
```

A character or a string as long as the mask. `null` or `""` leaves unfilled parts empty.

### `alwaysShowMask`

Show the mask prefix and placeholder even when the input is empty and unfocused.

### `transform`

Runs on every typed character before the mask test (and before `beforeMaskedStateChange`), so an
uppercase-only rule accepts lowercase typing.

```jsx
<InputMask mask="aaaaaa" transform="uppercase" />          // "abc" → "ABC"
<InputMask mask="9a9a" transform={(char, position) => char} />
```

The function form must be pure.

### `formatChars`

Map your own tokens to a `RegExp`, or use the shipped `extendedFormatChars`: `A` (uppercase),
`Я` (Cyrillic incl. Kazakh), `#` (hex).

```jsx
import InputMask, { extendedFormatChars } from "react-input-mask-format";

<InputMask mask="ww-ww" formatChars={{ w: /[a-z]/ }} />
<InputMask mask="AAA-###" formatChars={extendedFormatChars} />
```

String values (`{ w: "[a-z]" }`) still work but are deprecated.

### `beforeMaskedStateChange`

Change the masked value and selection before they are applied. Receives:

- `previousState` — state before the change; only on `change` events
- `currentState` — raw input state; not defined during render
- `nextState` — state with the mask applied

Each state is `{ value, selection: { start, end } }`; selection positions are `null` when the input is
unfocused and during render. Return the new state. The function runs more often than `onChange` and must be pure.

```jsx
function beforeMaskedStateChange({ nextState }) {
  const value = nextState.value.endsWith("/") ? nextState.value.slice(0, -1) : nextState.value;
  return { ...nextState, value };
}

<InputMask mask="99/99/99" maskPlaceholder={null} beforeMaskedStateChange={beforeMaskedStateChange} />
```

### `children`

Render another component instead of `<input>`. The child must forward its ref to the `<input>` (or to a
wrapper that contains one). Define `onChange`, `onMouseDown`, `onFocus`, `onBlur`, `value`, `disabled`
and `readOnly` on `InputMask`, not on the child — otherwise it throws.

```jsx
const CustomInput = React.forwardRef((props, ref) => <input ref={ref} {...props} />);

<InputMask mask="99/99/9999" value={value} onChange={onChange}>
  <CustomInput />
</InputMask>
```

`InputMask` injects its own ref into the child, so put your `ref` on `<InputMask>`; it receives the node
the child forwards to.

## `useMask` hook

Masks your own `<input>` through a ref callback. Options: `mask`, `maskPlaceholder`, `alwaysShowMask`,
`formatChars`, `transform`, `beforeMaskedStateChange`.

```tsx
const ref = useMask({ mask: "+7 (999) 999-99-99", maskPlaceholder: "_" });
<input ref={ref} name="phone" onChange={(e) => setPhone(e.target.value)} />
```

`useMask` is uncontrolled: don't pass a React `value`. `onChange` receives the masked value.
For a controlled input use `<InputMask>`.

## Presets

Ready-made configs in a separate, tree-shakable entry point. Spread them into `<InputMask>`:

```jsx
import { kzPhone, kzIban } from "react-input-mask-format/presets";

<InputMask {...kzPhone} value={phone} onChange={onChange} />
```

Masks are shown as users see them. PRs adding other countries are welcome.

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

`ruPlate` covers passenger-car plates, accepts Latin look-alikes and stores Cyrillic. With a 2-digit region
the value ends with the placeholder (`А 123 ВС 77_`); strip `_` if you need the bare plate.

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

Plates: standard individual and company plates (no personalised, diplomatic or foreign). There is no IBAN:
accounts are 20 digits plus a 5-digit MFO bank code.

### Kyrgyzstan

| export | mask | example |
| --- | --- | --- |
| `kgPhone` | `+996 (999) 99-99-99` (first code digit 2–9) | `+996 (555) 12-34-56` |
| `kgInnPerson` | `99999999999999` | `21503199001237` |
| `kgInnCompany` | `99999999999999` | `01605200710113` |
| `kgAccount` | `999 99999999999 99` | `125 12345678901 64` |
| `kgBik` | `999999` | `103001` |
| `kgPlate` | `99 999 aaa` (uppercase) | `01 123 ABC` |
| `kgPlateCompany` | `99 999 aa` (uppercase) | `08 456 AB` |
| `kgPostal` | `999999` | `720001` |
| `kgPassport` | `aa9999999` (uppercase) | `ID1234567` |

Plates: 2016+ format. There is no IBAN: accounts are 16 digits, the first 3 are the bank's BIK prefix.

### Masks with a fixed prefix

Masks that start with fixed text (`kzPhone`, `ruPhone`, `uzPhone`, `kgPhone`, `kzIban`) read pasted text and
programmatic `value`s with or without the prefix:

| preset | accepted forms |
| --- | --- |
| `kzPhone` | `+7 701 …`, `7 701 …`, `"7011234567"`, `"7771234567"`, `"+77771234567"` |
| `ruPhone` | `+7 912 …`, `8 912 …`, `"89123456789"` |
| `uzPhone` | `+998 90 …`, `998 90 …`, `8 90 …`, `"901234567"`, `"+998901234567"` |
| `kgPhone` | `+996 555 …`, `0555 12 34 56`, `"555123456"`, `"+996555123456"` |

- Pasted text longer than the mask keeps its **last** characters (the prefix part is dropped).
- Typing over a selection continues the prefix when the first key matches it (`7 701 …` in `kzPhone`),
  otherwise it starts after the prefix (`33 …` in `uzPhone`).
- Typed key by key, a number that starts with the prefix's own digits is read as the prefix: `uzPhone`
  `90 …` and `kzPhone` `777 …` over a selection, a leading `8` in `ruPhone` (area code `8xx`), `998 …`
  in an empty `uzPhone`. Pasting these works.
- A digits-only `value` shorter than a full international number is read as prefix digits + partial input
  (`uzPhone` `"998901234"` → `+998 (90) 123-4_-__`). Pass `+` and the country code, or a formatted value.

## Validators

Checksum and format validators in a separate entry point. They accept raw or formatted input and return
`false` on empty or invalid input.

```jsx
import { isValidIin, isValidRuAccount, luhn } from "react-input-mask-format/validators";

isValidIin("901010123458");                            // true
isValidRuAccount("40817810538091310419", "044525225"); // true
luhn("4242 4242 4242 4242");                           // true
```

| function | checks |
| --- | --- |
| `luhn` | card number, Luhn |
| `isValidIin`, `isValidBin` | KZ IIN / BIN, mod-11 |
| `isValidKzIban` | KZ IBAN, ISO 7064 MOD-97 |
| `isValidRuInn` | RU INN, 10 (company) or 12 (person) digits |
| `isValidRuSnils` | RU SNILS, mod-101 (numbers ≤ 001-001-998 are not checked) |
| `isValidRuOgrn`, `isValidRuOgrnip` | RU OGRN (13) / OGRNIP (15) |
| `isValidRuAccount(account, bik)` | RU account control key with BIK; treasury `03…` accounts: structure only |
| `isValidRuIban` | RU IBAN, MOD-97 |
| `isValidRuPlate` | RU plate, 2–3 digit region, Latin look-alikes accepted |
| `isValidRuKpp`, `isValidRuBik` | format only (no checksum exists) |
| `isValidUzPinfl` | UZ PINFL, 7-3-1 checksum + birth date |
| `isValidUzInn` | format only (checksum not published) |
| `isValidKgAccount` | KG account, NBKR MOD-97 |
| `isValidKgInn` | structure + embedded date (check digit not published) |
| `isValidKgBik` | format |

## Numbers & currency — `react-input-mask-format/number`

Numbers, currency and percentages. Props mirror `react-number-format`'s `NumericFormat`.

```tsx
import { NumberFormat, useNumberFormat, formatNumber } from "react-input-mask-format/number";

<NumberFormat
  value={value ?? ""}
  onValueChange={({ floatValue }) => setValue(floatValue)}
  thousandSeparator="," decimalScale={2} fixedDecimalScale prefix="$ "
/>
// typing "1234.5" → { value: "1234.5", formattedValue: "$ 1,234.50", floatValue: 1234.5 }

const ref = useNumberFormat({ thousandSeparator: " ", decimalScale: 2 }); // <input ref={ref} />
formatNumber(1234.5, { thousandSeparator: ",", decimalScale: 2, fixedDecimalScale: true }); // "1,234.50"
```

Options: `thousandSeparator` (`true` → `,`, or a string), `decimalSeparator` (`.`), `decimalScale`
(truncates, no rounding), `fixedDecimalScale`, `prefix`, `suffix`, `allowNegative` (`true`),
`allowLeadingZeros`, `isAllowed(values) => boolean` (e.g. min/max). `parseNumber` is the inverse of
`formatNumber`.

## Time — `react-input-mask-format/time`

24-hour `HH:MM` input.

```tsx
import { TimeFormat, useTimeFormat, formatTime, parseTime } from "react-input-mask-format/time";

<TimeFormat value={time} onValueChange={(v) => setTime(v.value)} />
const ref = useTimeFormat({ onValueChange: (v) => setTime(v.value) }); // <input ref={ref} />

formatTime("2999");  // "23:59"
parseTime("14:30");  // { value: "14:30", formattedValue: "14:30", hours: 14, minutes: 30 }
```

- `onValueChange` receives `{ value, formattedValue, hours, minutes }`. `value` is `""` until the time is
  complete and always uses `:`, whatever the `separator` option (default `:`).
- Complete hours are clamped to ≤ 23, complete minutes to ≤ 59; a single digit is never clamped.
- Resetting a controlled `value` to `""` does not clear a partly typed field; change the `key` to remount it.

## Known issues

### Autofill

Browser autofill needs an empty input or a value that matches the start of the autofilled one: `+1` or
`+1 (5` work with `+1 (555) 123-4567`, but `+1 (___) ___-____` does not. Options: set
`maskPlaceholder={null}`, apply the mask only to a non-empty value, or use less formatting. Phones and
postal codes are often autofilled; one-time codes are not.

### Cypress

`cy.get("input").focus().type("12345")` can produce `23/45/____`, because `focus()` is not an action
command. Call `.type()` directly, use `.click()` instead of `.focus()`, or add `.wait(50)` after `.focus()`.

## Migration

### Migrating from react-input-mask

**From v3-alpha** — the API is identical; change the import.

**From v2 (2.0.4 and earlier)** — your code keeps working: `maskChar`, `formatChars` and
`beforeMaskedValueChange` are deprecated aliases with a one-time dev warning. Recommended renames:

| v2 | this package |
| --- | --- |
| `maskChar="-"` / `maskChar={null}` | `maskPlaceholder="-"` / `maskPlaceholder={null}` |
| `formatChars={{ "#": "[0-9]" }}` | `formatChars={{ "#": /[0-9]/ }}` or an array mask |
| `beforeMaskedValueChange={(newState, oldState, userInput, options) => …}` | `beforeMaskedStateChange={({ previousState, currentState, nextState }) => …}` |
| `inputRef={el => …}` | `ref` |
| custom `children` (any child via `findDOMNode`) | the child must forward its ref, see [children](#children) |

### Migrating from react-number-format

Replace `NumericFormat` with `NumberFormat` from `react-input-mask-format/number`; the props listed in
[Numbers & currency](#numbers--currency--react-input-mask-formatnumber) are the same. Differences:
`decimalScale` truncates instead of rounding while typing, and there is no `PatternFormat` — use
`<InputMask>` for pattern masks.
