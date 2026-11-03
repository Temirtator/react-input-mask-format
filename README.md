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
  · [Date](#date--react-input-mask-formatdate) · [Cards](#cards--react-input-mask-formatcard)
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

Escape a format character with a backslash (`"+\\9\\98 (99) 999-99-99"`).

A typed key goes to the next slot, past the fixed characters before it. Pasted text and `value` read a fixed
character as itself only when the text repeats the whole fixed run up to the next slot. With
`mask="99.99.2099"`, `"010124"` and `"01012024"` both give `01.01.2024`, and typing `24` gives `2024`.

Array masks allow any per-position rule:

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

`card` is a fixed 16-digit mask. For Amex, 19-digit numbers and brand detection, use
[`react-input-mask-format/card`](#cards--react-input-mask-formatcard).

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
| `uzPhone` | `+998 90 …`, `998 90 …`, `8 90 …`, `"901234567"`, `"+998901234567"`, `"+998 90 123 45 6"` |
| `kgPhone` | `+996 555 …`, `0555 12 34 56`, `"555123456"`, `"+996555123456"` |

- Pasted text longer than the mask keeps its **last** characters (the prefix part is dropped), unless it starts
  with `+` and the country code: then extra characters at the end (an extension, a typo) are dropped
  (`+7 701 123 45 67 доб. 12` → `+7 (701) 123-45-67`).
- Typing over a selection continues the prefix when the first key matches it (`7 701 …` in `kzPhone`),
  otherwise it starts after the prefix (`33 …` in `uzPhone`).
- Typed key by key, a number that starts with the prefix's own digits is read as the prefix: `uzPhone`
  `90 …` and `kzPhone` `777 …` over a selection, a leading `8` in `ruPhone` (area code `8xx`), `998 …`
  in an empty `uzPhone`. Pasting these works.
- Text without `+` pasted into an empty field or over the whole value, or a `value` without `+`, that is
  shorter than a national number (9 digits in `uzPhone` and `kgPhone`, 10 in `kzPhone` and `ruPhone`) is
  read as the start of a national number, even when it begins with the country code: `uzPhone` `"90"` → `+998 (90) ___-__-__`, `"99890"` → `+998 (99) 890-__-__`;
  `kzPhone` `"701"` → `+7 (701) ___-__-__`. Longer digit strings follow the rules above (`uzPhone`
  `"998901234"` → `+998 (90) 123-4_-__`). For a partial international number, pass `+` and the country code.

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
- Backspace right after the separator in a full time deletes the hour digit before it (`12:|30` → `13:0`);
  Delete right before it deletes the minute digit after it.
- Changing `separator` re-lays out the shown time and calls `onValueChange` with the new values.
- Resetting a controlled `value` to `""` does not clear a partly typed field; change the `key` to remount it.

## Date — `react-input-mask-format/date`

Day, month and year with clamping, calendar checks and an ISO value.

```tsx
import { DateFormat, useDateFormat, formatDate, parseDate } from "react-input-mask-format/date";

<DateFormat value={date} onValueChange={(v) => setDate(v.value)} />            // DD.MM.YYYY
<DateFormat order="mdy" separator="/" value={date} onValueChange={(v) => setDate(v.value)} />
const ref = useDateFormat({ order: "ymd", separator: "-" }); // <input ref={ref} />

formatDate("12052024");    // "12.05.2024"
formatDate("2024-05-12");  // "12.05.2024"
parseDate("12.05.2024");   // { value: "2024-05-12", formattedValue: "12.05.2024", day: 12, month: 5, year: 2024 }
```

- `order` is `"dmy"` (default), `"mdy"` or `"ymd"`; `separator` defaults to `.`.
- `onValueChange` receives `{ value, formattedValue, day, month, year }`. `value` is the ISO `YYYY-MM-DD`
  date, whatever `order` and `separator` are, and is `""` until the date is complete and exists:
  `31.04.2024` and `29.02.2023` keep their parts but have no `value`.
- A day is clamped to 01–31 and a month to 01–12 when a key completes it, or when the whole value is set,
  pasted or autofilled; a single digit is never clamped and the year is not clamped. Typing a later field
  never changes an earlier one.
- Deleting or typing a digit in the middle shifts the digits after it; the shifted fields are not clamped,
  so retyping the digit restores the date (`12.05.2024`, Backspace the `5` → `12.02.024`, type `5` →
  `12.05.2024`). Until then `value` is `""`.
- Text written with separators in another layout is read by fields, so an ISO `value` from your state, a
  pasted `2024-05-12` or an autofilled `1.5.2024` lands in the right fields. A 4-digit group first is read
  as year-month-day; a 4-digit group last as day-month (month-day with `order="mdy"`). Other text is read
  as a stream of digits in the configured order.
- Backspace right after a separator deletes the digit before it, and Delete right before a separator the
  digit after it, with the same shift (`12.|05.2024`, Backspace → `10.52.024`).
- Changing `order` or `separator` re-lays out the shown date and calls `onValueChange` once with the new
  values; an empty field emits nothing.
- Resetting a controlled `value` to `""` does not clear a partly typed field; change the `key` to remount it.

## Cards — `react-input-mask-format/card`

Card number with brand detection and per-brand grouping, expiry `MM/YY` and CVC.

```tsx
import {
  CardNumberFormat,
  CardExpiryFormat,
  CardCvcFormat,
  isCardExpired,
} from "react-input-mask-format/card";
import type { CardBrand } from "react-input-mask-format/card";

const [number, setNumber] = useState("");
const [brand, setBrand] = useState<CardBrand>();
const [expiry, setExpiry] = useState("");
const [cvc, setCvc] = useState("");

<CardNumberFormat
  value={number}
  onValueChange={(v) => {
    setNumber(v.value);
    setBrand(v.brand);
  }}
/>
<CardExpiryFormat value={expiry} onValueChange={(v) => setExpiry(v.value)} />
<CardCvcFormat brand={brand} value={cvc} onValueChange={(v) => setCvc(v.value)} />
```

Each field also has a ref hook (`useCardNumberFormat`, `useCardExpiryFormat`, `useCardCvcFormat`) and pure
functions:

```ts
formatCardNumber("378282246310005");    // "3782 822463 10005"
parseCardNumber("4111 1111 1111 1111"); // { value: "4111111111111111", formattedValue: "4111 1111 1111 1111",
                                        //   brand: "visa", complete: true, valid: true }
detectCardBrand("2200");                // "mir"
formatCardExpiry("12/2026");            // "12/26"
parseCardExpiry("12/26");               // { value: "12/26", formattedValue: "12/26", month: 12, year: 2026 }
isCardExpired(10, 2026, new Date(2026, 9, 31)); // false: valid through the last day of the month
formatCardCvc("12345", { brand: "amex" });      // "1234"
```

The module reports the brand as a string and ships no logos. Map it to your own icons:

```tsx
const icons: Partial<Record<CardBrand, string>> = { visa: "/icons/visa.svg", mir: "/icons/mir.svg" };
{brand && icons[brand] && <img src={icons[brand]} alt={brand} />}
```

| brand | starts with | lengths | groups | CVC |
| --- | --- | --- | --- | --- |
| `visa` | 4 | 13, 16, 19 | 4-4-4-4-3 | 3 |
| `mastercard` | 51–55, 2221–2720 | 16 | 4-4-4-4 | 3 |
| `amex` | 34, 37 | 15 | 4-6-5 | 4 |
| `diners` | 300–305, 36, 38–39 | 14–19 | 4-6-4 at 14, else 4-4-4-4-3 | 3 |
| `discover` | 6011, 644–659 | 16–19 | 4-4-4-4-3 | 3 |
| `unionpay` | 62, 81 | 16–19 | 4-4-4-4-3 | 3 |
| `jcb` | 3528–3589 | 16–19 | 4-4-4-4-3 | 3 |
| `maestro` | 50, 5600–5613, 5615–5899, 63, 67 | 12–19 | 4-4-4-4-3 | 3 |
| `mir` | 2200–2204 | 16–19 | 4-4-4-4-3 | 3 |
| `uzcard` | 8600, 5614 | 16 | 4-4-4-4 | 3 |
| `humo` | 9860 | 16 | 4-4-4-4 | 3 |
| `belkart` | 9112 | 16 | 4-4-4-4 | 3 |
| `elcart` | 9417 | 16 | 4-4-4-4 | 3 |

- `brand` is set as soon as the typed prefix fits only one brand: `4` is Visa, `2` and `22` are still
  undefined (Mir or Mastercard), `220` is Mir, `222` is Mastercard. A prefix outside the table can still be
  typed up to 19 digits, grouped 4-4-4-4-3, with `brand: undefined`.
- `complete` means the brand is known and the digit count is one of its lengths. `valid` is `complete` plus
  the Luhn check, except for UnionPay, which does not require Luhn. For an unknown brand both are `false`;
  call `luhn` from `react-input-mask-format/validators` if you accept such numbers.
- Typing or pasting past the brand's longest length drops the extra digits. Backspace right after a group
  separator deletes the digit before it and regroups (`4111 |1111` → `4111 111`).
- Expiry: `value` is `MM/YY` with `/` whatever the `separator` option (default `/`), and `""` until month and
  year are complete. The month is clamped to 01–12 when a key completes it; the year is not clamped, and
  `year` is `2000 + YY`. A pasted or autofilled `12/2026` or `1/26` lands in the right fields.
  `isCardExpired(month, year, now = new Date())` uses local time.
- CVC: 4 digits for `amex`, otherwise 3 (also when `brand` is undefined). When `brand` changes from `amex`
  to another brand, a 4-digit CVC is cut to 3 and `onValueChange` is called with the shorter value.
- Components default to `inputMode="numeric"` and `autoComplete` `cc-number`, `cc-exp` or `cc-csc`; your
  props override them.
- `value` is optional: without it a card field keeps what the user types and only reports it through
  `onValueChange`.
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

### Migrating from react-imask

Replace `IMaskInput` with `InputMask` and `useIMask` with `useMask`. Pattern masks translate token by token
(`0` → `9`); `mask={Number}` and `mask={Date}` move to the [`/number`](#numbers--currency--react-input-mask-formatnumber)
and [`/date`](#date--react-input-mask-formatdate) modules. `onChange` receives the masked value: there is no
`onAccept` and no `unmask`.

| react-imask | this package |
| --- | --- |
| `<IMaskInput mask="…" />` | `<InputMask mask="…" />` |
| `useIMask(opts, { onAccept })` → `{ ref, value, unmaskedValue, … }` | `useMask(options)` → a ref only; read the value in the input's `onChange` |
| `0` | `9` |
| `a` (any letter) | `a` (A–Z, a–z); `Я` from `extendedFormatChars` for Cyrillic |
| `*` (any character) | `*` (A–Z, a–z, 0–9) |
| `\\0` (a fixed `0`) | `0` |
| a fixed `9`, e.g. `+998` | `"+\\9\\98"` |
| `{7}` (fixed part kept in the unmasked value) | `7`: the value always contains the fixed parts |
| `[…]` (optional part) | not supported |
| `lazy` (default): only typed characters | `maskPlaceholder={null}` |
| `lazy={false}` | `alwaysShowMask` |
| `placeholderChar="#"` | `maskPlaceholder="#"` |
| `definitions={{ "#": /[1-6]/ }}` | `formatChars={{ ...defaultFormatChars, "#": /[1-6]/ }}` |
| `prepareChar={(str) => str.toUpperCase()}` | `transform="uppercase"` or `transform={(char, position) => …}` |
| `unmask` | no helper; `value.replace(/\D/g, "")` for digit masks |
| `onAccept={(value) => …}` | `onChange={(e) => …}` with `e.target.value` |
| `onComplete` | no event; check the value in `onChange` |
| `inputRef` | `ref` |
| `IMaskMixin(Component)` | [`children`](#children) |
| `mask={Date}` | `DateFormat` from `react-input-mask-format/date` |
| `mask={Number}` with `scale`, `radix`, `thousandsSeparator`, `padFractionalZeros`, `min` / `max` | `NumberFormat` with `decimalScale`, `decimalSeparator`, `thousandSeparator`, `fixedDecimalScale`, `isAllowed` |
| an array of masks, `dispatch` | change the `mask` prop from your state; `CardNumberFormat` for card numbers |
| `blocks`, `MaskedRange`, `MaskedEnum` | an array mask with a `RegExp` per position, `DateFormat`, `TimeFormat` |

Phone with the mask always shown and the digits extracted:

```jsx
// react-imask
<IMaskInput
  mask="+{7} (000) 000-00-00"
  lazy={false}
  unmask
  value={phone}
  onAccept={(value) => setPhone(value)} // "77012345678"
  onComplete={(value) => save(value)}
/>

// react-input-mask-format
<InputMask
  mask="+7 (999) 999-99-99" // or {...kzPhone}, {...ruPhone}
  alwaysShowMask
  value={phone}
  onChange={(e) => setPhone(e.target.value)} // "+7 (701) 234-56-78"
/>
const digits = phone.replace(/\D/g, ""); // "77012345678"
const complete = digits.length === 11;
```

Keep the masked value in state and derive the digits from it.

Custom definitions and uppercase input:

```jsx
// react-imask
<IMaskInput mask="#00000" definitions={{ "#": /[1-6]/ }} />
<IMaskInput mask="aa0000000" prepareChar={(str) => str.toUpperCase()} />

// react-input-mask-format
import InputMask, { defaultFormatChars } from "react-input-mask-format";

<InputMask mask="#99999" formatChars={{ ...defaultFormatChars, "#": /[1-6]/ }} />
<InputMask mask="aa9999999" transform="uppercase" /> // same as the uzPassport preset
```

Date:

```jsx
// react-imask
<IMaskInput mask={Date} unmask="typed" onAccept={(date) => setDate(date)} /> // Date, null until complete

// react-input-mask-format
import { DateFormat } from "react-input-mask-format/date";

<DateFormat value={date} onValueChange={(v) => setDate(v.value)} /> // "2024-05-12", "" until complete
```

Differences:

- `InputMask` and `useMask` report only the masked value. The `/number`, `/date`, `/time` and `/card`
  components report parsed values in `onValueChange`.
- `formatChars` replaces the default tokens: spread `defaultFormatChars` to keep `9`, `a` and `*`.
- No optional parts, `blocks`, `overwrite`, `eager`, `skipInvalid`, `displayChar`, `validate` or `commit`.
- No pipe for pattern masks; a controlled `value` is formatted on render. The modules export `formatNumber`,
  `formatDate`, `formatTime` and `formatCardNumber`.
- `DateFormat` has no `min` / `max` and gives an ISO string, not a `Date`; build one from `day`, `month` and
  `year` if you need it.

### Migrating from @react-input/mask

`InputMask` and `useMask` keep their names. Slots in the mask are the format characters `9`, `a`, `*` (or your
`formatChars`) instead of `replacement` keys, and `maskPlaceholder` sets what unfilled slots show.

| @react-input/mask | this package |
| --- | --- |
| `mask="+7 (___) ___-__-__" replacement={{ _: /\d/ }}` | `mask="+7 (999) 999-99-99"` |
| `replacement={{ _: /[A-Z]/ }}` | `formatChars={{ "#": /[A-Z]/ }}` with `#` in the mask, or an array mask |
| `replacement="_"` (any character) | `*` (A–Z, a–z, 0–9), or a `formatChars` token that does not match the placeholder: `/[^_]/` |
| `showMask` | `alwaysShowMask` |
| no `showMask`: `+7 (912` | `maskPlaceholder={null}`: `+7 (912) ` |
| replacement keys as the placeholder: `dd.mm.yyyy` | `maskPlaceholder="dd.mm.yyyy"` |
| `separate` | the default with a `maskPlaceholder`: a deleted character leaves its slot empty; with `maskPlaceholder={null}` the following characters shift left |
| `track` | `transform` per character, `beforeMaskedStateChange` for the whole value and selection |
| `modify` | change `mask` and the other props from your state |
| `onMask` (v1), `unformat` | `onChange`; `value.replace(/\D/g, "")` for digit masks |
| `format` for an initial value | not needed: a raw `value` or `defaultValue` is formatted on render |
| `generatePattern`, `formatToParts` | not supported; checksums in [Validators](#validators) |
| `component={CustomInput}` | `<InputMask><CustomInput /></InputMask>`, see [children](#children) |
| `useMask({ mask, replacement })` | `useMask({ mask })` |

Phone with the mask always shown and the digits extracted:

```jsx
// @react-input/mask
import { InputMask, unformat } from "@react-input/mask";

const options = { mask: "+7 (___) ___-__-__", replacement: { _: /\d/ } };
<InputMask
  {...options}
  showMask
  onChange={(e) => setDigits(unformat(e.target.value, options))} // "9123456789"
/>

// react-input-mask-format
import InputMask from "react-input-mask-format";
import { ruPhone } from "react-input-mask-format/presets";

<InputMask
  {...ruPhone}
  alwaysShowMask
  onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(1))} // "9123456789"
/>
```

`.slice(1)` drops the `7` of `+7`, which `unformat` leaves out. `ruPhone` also reads a pasted `8 912 …` or
`+7 912 …`, see [Masks with a fixed prefix](#masks-with-a-fixed-prefix).

Date with letters as the placeholder:

```jsx
// @react-input/mask
<InputMask mask="dd.mm.yyyy" replacement={{ d: /\d/, m: /\d/, y: /\d/ }} showMask separate />

// react-input-mask-format
<InputMask mask="99.99.9999" maskPlaceholder="dd.mm.yyyy" alwaysShowMask />

// or, with day and month clamping and an ISO value:
import { DateFormat } from "react-input-mask-format/date";

<DateFormat value={date} onValueChange={(v) => setDate(v.value)} />
```

Custom token with uppercase input:

```jsx
// @react-input/mask
<InputMask
  mask="____ ____"
  replacement={{ _: /[0-9A-F]/ }}
  track={({ data }) => data && data.toUpperCase()}
/>

// react-input-mask-format
<InputMask mask="#### ####" formatChars={{ "#": /[0-9A-F]/ }} transform="uppercase" />
```

Differences:

- `onChange` receives the masked value with placeholders (`+7 (912) ___-__-__`). There is no `unformat`, and
  `value.replace(/\D/g, "")` keeps the digits of fixed parts (the `7` of `+7`).
- `9`, `a` and `*` are always slots unless escaped (`"+\\9\\98"`). `formatChars` replaces them: spread
  `defaultFormatChars` to use them next to your own tokens.
- Deleting in the middle keeps positions while a `maskPlaceholder` is set (`12/34/5678`, Backspace after the
  `3` → `12/_4/5678`), like `separate`. With `maskPlaceholder={null}` the following characters shift left
  (`12/45/678`); there is no option to shift while a placeholder is shown.
- `beforeMaskedStateChange` receives the previous, current and next `{ value, selection }` instead of
  `inputType` and `data`.
