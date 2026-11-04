# Changelog

## Unreleased

### Changed
- **Breaking:** the published code targets ES2020 and keeps `??` and `?.`. Supported: Chrome 80, Firefox 72,
  Safari 13.1, Node 14 and newer. A toolchain that cannot parse ES2020, such as webpack 4 without Babel for
  `node_modules`, has to transpile the package. Bundles get smaller: index −77 B, number −100 B, time, date and card
  −70 to −90 B.

- Importing one function no longer pulls in the components of its entry. `InputMask`, `NumberFormat`,
  `DateFormat`, `TimeFormat` and the card fields are marked as pure, so bundlers drop them when unused. Measured
  with esbuild (brotli): `useMask` alone 6.2 → 4.8 kB, `formatDate` 2.0 → 0.7 kB, `detectCardBrand` 2.4 → 0.7 kB,
  `formatNumber` 2.0 → 0.9 kB, `extendedFormatChars` 5.5 → 0.3 kB. A Vite app that imports only `formatDate` is
  3.8 kB (minified) smaller. `displayName`s are unchanged.

- Internal property names are shortened in the published code (esbuild `mangleProps` with an explicit list of
  names that are never part of the API): index 6.24 → 5.95 kB, `useMask` alone 4.78 → 4.50 kB.

### Internal
- size-limit also checks what importing one name costs (`useMask`, `formatNumber`, `formatDate`, `detectCardBrand`,
  `CardNumberFormat`, …), so tree-shaking cannot regress unnoticed.
- CI runs the whole test suite a second time against the built `dist` files (`npm run test:dist`), and also on
  pushes to `next`.

## 2.14.0

### Changed
- Presets set keyboard and autofill hints, so phones show the right keypad. Phone presets add `inputMode="tel"` and
  `autoComplete="tel"`. Presets that take only digits (IINs, INNs, accounts, postal codes, `card`, …) add
  `inputMode="numeric"`, postal codes also add `autoComplete="postal-code"`, and `card` adds
  `autoComplete="cc-number"`. Presets with letters (IBANs, plates, passports, `vin`) are unchanged. Spread onto
  `<InputMask>`, the hints reach the `<input>`; a prop passed explicitly wins. `MaskPreset` has the new optional
  `inputMode` and `autoComplete` fields.
- `useMask` throws when `maskPlaceholder` is neither one character nor as long as the mask, like `<InputMask>` always
  did. Before, the hook showed broken text (`mask: "99-99"`, `maskPlaceholder: "ab"` gave `ab-`, then `1b-`).
- The test-DOM workaround is left out of production builds (`process.env.NODE_ENV === "production"`), which
  makes the bundles smaller: index −0.1 kB, number, time, date and card −50 to −70 B.

### Fixed
- Next.js App Router: rendering `<InputMask>`, `NumberFormat`, `DateFormat`, `TimeFormat` or a card field in a Server
  Component no longer fails the build (`TypeError: useRef is not a function`). Under the `react-server` export
  condition the component entries resolve to `dist/rsc/*.js`, which re-export them behind `"use client"`. Other
  bundlers get the plain modules, so Vite shows no directive warning. `/presets` and `/validators` stay plain modules.
- TypeScript with `"moduleResolution": "node"`: `react-input-mask-format/presets`, `/validators`, `/number`, `/time`,
  `/date` and `/card` now resolve their types (`typesVersions`). Before, every subpath import failed with `TS2307`.
- TypeScript without `esModuleInterop`: the published types no longer default-import React, which gave `TS1259` or
  props without their React types (`onChange={e => …}` reported an implicit `any`).
- Server rendering on React 16–18 no longer logs "useLayoutEffect does nothing on the server" for every field.
- `NumberFormat` works without a `value` prop. Before, an uncontrolled field could not be typed into (`<NumberFormat
  thousandSeparator="," />` stayed empty) and `defaultValue` was ignored with a React warning. Now it keeps what is
  typed, shows `defaultValue` (a number or a string, read like `value`) without reporting it through `onValueChange`,
  goes back to it on form reset, and re-formats when its options change. Once a `value` has been passed, `undefined`
  clears the field like `""`, so `value={values.floatValue}` still empties it.
- `NumberFormat`, `DateFormat`, `TimeFormat`, `CardNumberFormat`, `CardExpiryFormat` and `CardCvcFormat` call an
  `onChange` prop, with `event.target.value` already formatted (`1,234`, `12.05.2024`). Before, it was silently
  replaced, so react-hook-form's `register` never saw a change: `watch`, `mode: "onChange"` validation and the
  submitted value stayed empty. `onChange` is now part of their props types. With `register`, the fields also show
  `useForm({ defaultValues })`. Values the form writes later (`reset(values)`, `setValue`) are not shown; use
  `Controller` for those.
- A form reset cancelled with `preventDefault()` no longer resets `DateFormat`, `TimeFormat`, the card fields and
  `NumberFormat`.
- `useNumberFormat` re-formats the text in the input when its options change (`prefix` `$` → `€` turns `$12.34` into
  `€12.34`; `decimalScale` 2 → 0 gives `€12`), like `<NumberFormat>`, and keeps the caret after the same digits.
  Before, the old text stayed until the next edit.
- Tests that run under happy-dom get correct values from `useMask`, `useNumberFormat` and the digit-field hooks.
  Before, typing `12052024` into `useMask({ mask: "99/99/9999" })` gave `12/_0/_5_2`, because a workaround for
  the test DOM recognised only jsdom.
- Masked fields with `type="number"` or `type="email"` no longer throw on every key; `NumberFormat type="number"`
  no longer unmounts the whole React tree. These types have no text selection, so the browser rejected the caret
  update (`InvalidStateError`), and they still cannot be masked. In development a console error now says so once
  per type and suggests `type="text"` or `type="tel"` with `inputMode="numeric"`.
- `<InputMask value={123456} mask="999-999">` shows `123-456`. Before, a number `value` (allowed by the types)
  threw `string.split is not a function`, and `0` was shown unmasked and passed to `beforeMaskedStateChange` as a
  number; a `defaultValue` of `0` is no longer dropped.
- In development, a custom child of `InputMask` that does not forward its ref gets an error that says so, instead
  of `Cannot read properties of null (reading 'getRootNode')`. The error for a child without an `<input>` names this
  package instead of the old `react-input-mask`.
- In development, a mask without editable positions (`mask="+7"`, `mask={[]}`) logs a console error once.
- `V2MaskOptions`, used by the `BeforeMaskedValueChangeFn` type, is exported.

### Internal
- CI packs the package and checks it the way consumers use it: ESM and CJS imports of every entry, server rendering
  on React 17, 18 and 19 without console errors, types under `bundler`, `node16` and `node` resolution with and
  without `esModuleInterop`, and a Next.js App Router build.
- Hydration tests for every component, and the server-render tests fail on any console error.
- CI: read-only token by default, PR runs cancel superseded ones, the React matrix no longer stops at the first
  failure, the Playwright report and traces are uploaded when e2e fails, coverage is measured with thresholds (lines
  99%, branches 96%), and an e2e run on WebKit (Safari's engine) reports without blocking yet.
- Releases: the workflow checks that the tag matches `package.json`, runs lint, typecheck, tests, build, publint and
  size-limit before publishing, pins npm 11, and takes the GitHub Release notes from this changelog. Dependabot
  keeps dev dependencies and actions up to date; `SECURITY.md` describes private vulnerability reports.

## 2.13.0

### Added
- Belarus pack in `react-input-mask-format/presets`: `byPhone`, `byPersonalId`, `byUnp`, `byIban`, `byPlate`,
  `byPostal`, `byPassport`. `byPhone` skips the domestic `8 0…` prefix (`"80291234567"` becomes
  `+375 (29) 123-45-67`); `byPersonalId`, `byUnp`, `byPlate` and `byPassport` turn typed Cyrillic look-alikes
  into Latin. Validators `isValidByPersonalId` (7-3-1), `isValidByUnp` (MNS mod-11) and `isValidByIban`
  (MOD-97).
- Tajikistan pack: `tjPhone`, `tjInn`, `tjEin`, `tjAccount`, `tjBik`, `tjPlate`, `tjPlateCompany`
  (Cyrillic look-alikes typed on a Russian layout become Latin), `tjPostal`, and `isValidTjInn` (9 digits; the check digit is not published, so format only).
- Armenia pack: `amPhone` (skips the domestic leading `0`), `amPsn`, `amTin`, `amAccount`, `amPlate`,
  `amPostal`, `amPassport`, and the structure validators `isValidAmPsn`, `isValidAmTin` and
  `isValidAmAccount`.
- Azerbaijan pack: `azPhone` (skips the domestic `0` and `00994`), `azFin` (a typed `O` becomes `0`),
  `azVoen`, `azIban`, `azPlate`, `azPostal` (`1000` and `AZ 1000` become `AZ1000`), `azPassport`, and
  validators `isValidAzVoen` (VÖEN mod-11), `isValidAzIban` (MOD-97) and `isValidAzFin` (structure).
- `vin` preset in `react-input-mask-format/presets` (17 characters, uppercase, Cyrillic look-alikes become
  Latin, `I` becomes `1`, `O`/`Q` become `0`) and `isValidVin` validator (format only, no check digit).
- `iban` preset (any country, up to 34 characters grouped by 4, uppercase, Cyrillic look-alikes become Latin)
  and `isValidIban(value, country?)` validator (ISO 13616 structure and MOD-97 for any country; `country`
  restricts the code). Georgia, Moldova, Ukraine and other IBAN countries without a pack can use them.
- Phone and postal presets for Georgia (`gePhone`, `gePostal`), Moldova (`mdPhone`, `mdPostal`), Ukraine
  (`uaPhone`, `uaPostal`) and Turkmenistan (`tmPhone`, `tmPostal`). Phones read international, domestic (`0…`,
  Turkmen `8…`, pasted Ukrainian `8…`) and national forms; demo tabs GE, MD, UA, TM.
- `phonePresets` (ISO code → phone preset for the 12 countries) and `detectPhoneCountry(text)` (country of an
  international `+…` or `00…` number, `+7` split into Kazakhstan and Russia) in `react-input-mask-format/presets`,
  with a README recipe for a phone field with a country picker that switches when another country's number is
  pasted.
- `valueIsNumericString` on `NumberFormat`: a string `value` is read as a canonical number (`"1234.5"`) whatever
  `thousandSeparator` and `decimalSeparator` are, as in react-number-format.
- `allowedDecimalSeparators` for `NumberFormat`, `useNumberFormat`, `formatNumber` and `parseNumber`: characters
  also read as the decimal separator, as in react-number-format. The default `["."]` means a `.` typed or pasted
  into a `decimalSeparator=","` field becomes `,` (`12.5` → `12,5`; before, it was dropped and gave `125`). It is
  ignored when it equals `thousandSeparator`, when the text already has the decimal separator, and when it occurs
  more than once (`1.234.567` stays `1 234 567`). A string `value` such as `"12.5"` is read the same way. The
  `prefix` and `suffix` are removed before, also when the user typed outside them, so the dot of ` руб.` never
  becomes the separator (a digit typed after the suffix joins the number: `123 руб.`).
- The demo has BY, TJ, AM and AZ tabs.
- Demo: a playground to try any mask, `maskPlaceholder`, `alwaysShowMask` and `transform`, or start from a
  preset, with the matching JSX to copy.

### Changed
- `DateFormat` and `TimeFormat` render `inputMode="numeric"` by default, like the card components, so phones show
  a digit keypad. Pass `inputMode` to override it.

### Fixed
- `DateFormat` and `TimeFormat` without a `value` prop are now uncontrolled. Before, they were controlled with
  `""`, so the field was emptied as soon as the date or time was complete (`12052024` typed into `<DateFormat />`
  became empty); now it keeps `12.05.2024` and still calls `onValueChange` on every edit. `value={undefined}`
  counts as no `value`; pass `""` to clear the field.
- `DateFormat`, `TimeFormat`, `CardNumberFormat`, `CardExpiryFormat` and `CardCvcFormat` support `defaultValue`.
  Before, it reached the `<input>` next to `value`, React warned and the text was ignored; now
  `<DateFormat defaultValue="2024-05-12" />` shows `12.05.2024` and is not reported through `onValueChange`.
  `defaultValue` is now typed `string`; a number or array `defaultValue` no longer compiles (it never worked at
  runtime).
- A form reset brings an uncontrolled `DateFormat`, `TimeFormat` or card field back to its `defaultValue` (or
  empty), like a plain input. A controlled field keeps showing its `value`.
- `InputMask` and `useMask` no longer drop what you type after moving the caret past the last slot of a focused
  field (a click at its right edge or End). Before, every character was lost (`+7 (701) ___-__-__` stayed as
  is); now typing and pasting go to the slot after the last filled one, where focus puts the caret (`2345678`
  gives `+7 (701) 234-56-78`), and a key no slot accepts moves the caret there. A field whose last slot is
  filled still ignores typing at the end. A placeholder character typed into the last slot is replaced by the
  next typed character.
- Pasting a complete international number (`+`, the country code and every digit of the national number) into a
  partly or fully filled field of a phone preset or a custom mask whose prefix is `+` and the country code
  (`+1 (999) 999-9999`) now replaces the whole value, wherever the caret or selection is. Before, the country code was read as national digits at the caret
  (`+7 (701) ___-__-__` + paste `+7 701 234 56 78` → `+7 (701) 770-12-34`); now it gives `+7 (701) 234-56-78`.
  A number with digits missing is still inserted at the caret, and typing is unchanged.
- Masked inputs inside a shadow root (web components) work. Focus was checked against
  `document.activeElement`, which is the shadow host there, so `<InputMask>` and `useMask` dropped typed
  characters and moved the caret to the end; `./date`, `./time`, `./card` and `./number` lost their caret
  placement. Focus is now checked against the input's own root.
- A selection made while a partly filled `<InputMask>` or `useMask` field takes focus now survives the click,
  so `onFocus={e => e.target.select()}` selects the whole value and the next key replaces it. Before, the click
  moved the caret to the first empty slot. Only a selection of the whole value is kept: an empty field still
  gets the caret on its first slot, and a quick click, also one that moves the mouse a little and selects a few
  characters, still moves the caret there.
- `NumberFormat` and `useNumberFormat`: a typed decimal separator puts the caret right after the separator in the
  result, so with `fixedDecimalScale` `1234.5` gives `1,234.50` (before: `12,345.00`, the caret stayed in front
  of `.00`), `.5` in an empty field gives `0.5` (before: `50.`), and a separator typed into the integer part or
  in front of an existing one moves the caret into the fraction. Deleting never steps over the separator, so
  holding Backspace from the end of `1,234.00` walks into the integer part.
- `NumberFormat` with a `decimalSeparator` other than `.`: passing the `value` from `onValueChange` back as the
  `value` prop no longer re-reads its `.` as a thousands mark (`12,5` stayed, but with `fixedDecimalScale` typing
  `12` showed `1 200,00`).
- `NumberFormat` re-formats when its options change. Before, a controlled field kept showing the text formatted
  with the old options (a `prefix` switched from `$ ` to `€ ` still showed `$ 12`). The text being edited is
  kept, also when an option changes in the same render as the edit (a suffix that depends on the value).
- `NumberFormat`, `useNumberFormat` and `formatNumber` with `decimalScale: 0` ignore the decimal separator.
  Before, a typed or pasted `.` stayed at the end (`12.`) and the next digits went nowhere until it was
  deleted; now `12.` shows `12`, a pasted `1,234.56` becomes `1,234`, and a `.` typed in the middle of
  `1,234` changes nothing.
- `useMask` re-formats the text already in the input when `mask`, `maskPlaceholder`, `alwaysShowMask`,
  `formatChars` or `transform` change, like `<InputMask>` does. Before, the hook kept the old layout until the
  next edit (`12/34` stayed after switching to `99-99-99`; now it shows `12-34-__`), and turning
  `alwaysShowMask` on did not show the template.
- `useMask()` without a `mask` (or with `mask: null`, both allowed by its types) no longer throws
  `Cannot read properties of null` on mount; the input works as a plain input, and a mask passed later is applied
  to the text already typed with the caret on the first empty slot, as in `<InputMask>`. `<InputMask>`'s `mask`
  prop is now typed `Mask | null` too (it already worked without a mask at runtime).
- Form reset brings back the formatted `defaultValue` (`12/12/2020`) for `<InputMask>` and `useMask`. Before, the
  browser restored the raw `defaultValue` (`12122020`). `<InputMask>` now renders the formatted `defaultValue` on
  the `<input>`; `useMask` re-formats after the form's `reset` event.
- Focusing a field whose value is full but was not formatted by the mask (set with `el.value = …` without an
  event, as form libraries do on reset) puts the caret at the end. Before, it went to the start, so Backspace did
  nothing and typing replaced the first digit.
- A value written into the input without an input event (form reset, `el.value = …` from a form library) is
  taken as the current value on focus, in `<InputMask>` and `useMask`. Before, the mask kept its previous value:
  blurring cleared a reset or written `01/02/2003`, and the next edit was read as a replacement of the whole
  value.
- `useMask` binds an input that remounts (for example through `key`) with the current options, not the ones of
  the first render.
- Delete (forward delete) in `<InputMask>` and `useMask` with a `maskPlaceholder` moves the caret past the slot it
  cleared, so pressing it again deletes the next character (`|12/34/5678` → `_|2/34/5678` → `__|/34/5678` →
  `__/_|4/5678`). Before, the caret stayed in front of the cleared slot and every further Delete did nothing.
  Without a placeholder the following characters still shift left and the caret stays. Delete on a slot that is
  already empty leaves the caret there, and once everything is deleted the caret goes back to the first slot.
- Delete in front of fixed characters at the end of the mask (`12| kg` with `99 kg`) does nothing. Before, it
  cleared the first slot (`_2 kg`).
- Browser autofill into a masked field that the user had visited and left empty (so it was cleared on blur) gives
  the right value. Before, the caret position from the earlier visit was used for the new text:
  `+77012345678` became `+7 (723) 456-78-__` or `+7 (7__) ___-__-__`, and a date `12/05/2024` became
  `20/24/____`. A caret that starts beyond the end of the previous value is now treated as unknown.

### Internal
- React StrictMode tests for `useMask`, `./number`, `./time`, `./date` and `./card` components and hooks, and more
  cases for `InputMask`: each scenario runs with and without `<StrictMode>` and must show the same value, caret and
  emitted values.
- Property-based tests (fast-check) for `./number`, `./time`, `./date`, `./card` and the shared digit-field
  helpers: idempotence, format/parse round trips, output shape and ranges, truncation, separator and brand
  invariants, and Backspace/Delete next to a separator.

## 2.12.0

### Added
- `react-input-mask-format/card`: `CardNumberFormat`, `CardExpiryFormat`, `CardCvcFormat`, their ref hooks
  (`useCardNumberFormat`, `useCardExpiryFormat`, `useCardCvcFormat`), `formatCardNumber` / `parseCardNumber`,
  `formatCardExpiry` / `parseCardExpiry`, `formatCardCvc` / `parseCardCvc`, `detectCardBrand` and
  `isCardExpired`. The number is grouped by brand (Amex `3782 822463 10005`, Diners 4-6-4, up to 19 digits for
  Visa, Mir, UnionPay and others) and reports `brand`, `complete` and `valid` (Luhn, skipped for UnionPay).
  Brands: Visa, Mastercard, Amex, UnionPay, JCB, Maestro, Diners, Discover, Mir, Humo, UzCard, Elcart and
  Belkart. The CVC length follows the `brand` option (4 for Amex).

### Changed
- Behavior change in `./time` and `./date`: Backspace right after a separator in the middle of the value now
  deletes the digit before it, and Delete right before a separator the digit after it (`12:|30` → `13:0`,
  `12.|05.2024` → `10.52.024`). Before, the separator was put back and the key did nothing.
- Behavior change in `./time` and `./date`: when `separator` or `order` changes the shown text, the component
  and the hook call `onValueChange` once with the new values. The hook (`useTimeFormat`, `useDateFormat`) now
  also re-lays out the input when these options change; before, only the component did. A new
  `onValueChange` function on every render does not trigger a call.

## 2.11.0

### Added
- `react-input-mask-format/date`: `DateFormat`, `useDateFormat`, `formatDate` and `parseDate` for day, month and
  year in `dmy`, `mdy` or `ymd` order with any separator. Complete days and months are clamped, `value` is the
  ISO `YYYY-MM-DD` date once it is complete and exists in the calendar, and an ISO or differently laid out
  date (`2024-05-12`, `1.5.2024`) passed as `value`, pasted or autofilled lands in the right fields.

### Fixed
- `TimeFormat` and `useTimeFormat` with a separator longer than one character (`separator=" : "`): Backspace
  right after the separator now deletes it together with the last hour digit, as with `:`. Before, the
  deleted separator character was put back and Backspace had no effect.
- `TimeFormat`: after the parent showed another value, resetting `value` to `""` no longer brings back an
  earlier partly typed time. Changing `separator` after an edit re-lays out the shown time.

### Internal
- `./time` and `./date` share the input, caret and Backspace handling.
- The mask engine moved from `src/utils/mask.ts` to `src/core/mask.ts`, next to the other core modules. No API or
  behavior change.

## 2.10.0

### Changed
- Behavior change: in pasted text and `value`, a fixed character inside the mask that a slot also accepts is
  read as the fixed character only when the text repeats the whole fixed run up to the next slot. With
  `mask="99.99.2099"`, `"010124"` → `01.01.2024` (was `01.01.204_`); `"01012024"` and a formatted value are
  unchanged. Typing is unchanged: each key goes to the next slot.
- Behavior change: a placeholder character (`_`) in pasted text or `value` that lands on a fixed character is
  kept as an empty slot, as when it is typed. Before, it was dropped and the next character took its slot
  (`mask="99/99/9999"`, `"12_34"` → `12/_3/4___`, was `12/34/____`).

### Fixed
- Pasting a formatted value back into a mask with a fixed prefix of letters or digits without `+`
  (`mask="\\979"`, paste `97_` over the whole value) keeps it. Before, the prefix was read as input
  (`977`).

### Internal
- The property-test pins and exclusions for these cases are removed. Typing versus paste around a fixed
  character that a slot accepts is pinned as by design.

## 2.9.0

### Changed
- Behavior change: pasted text and a `value` without `+` that are shorter than a national number are read as
  the start of a national number in the prefixed phone presets and any custom `+` mask, and paste and
  `formatValue` now agree. Fixed: `uzPhone` `value="90"` → `+998 (90) ___-__-__` (was `+998 (0_) …`),
  `kzPhone` paste `701` into an empty field or over the whole value → `+7 (701) ___-__-__` (was
  `+7 (770) 1__-__-__`). Changed: a partial number that
  starts with the country code is no longer read as code + rest (`uzPhone` `"99890"` → `+998 (99) 890-__-__`,
  was `+998 (90) …`; `kzPhone` `"777"` → `+7 (777) …`, was `+7 (77_) …`; `kgPhone` `"99655"` →
  `+996 (996) 55-__-__`, was `+996 (55_) …`). A single key that starts the country code still continues it,
  so typing `+998 90 …` or `998 90 …` key by key is unchanged. Full-length numbers are unchanged.

### Fixed
- Text with no character the mask accepts (`!`, a letter in a digit slot) typed or pasted over a selection that
  starts in the prefix no longer clears the value; it is ignored, as in masks without a prefix.
- After pasting a complete country code (`+998` into `uzPhone`) or text with characters the mask rejects, the
  caret lands after the prefix instead of inside it. While the code is still being typed key by key (`+`,
  `+9`), the caret stays inside the prefix so the next key continues it.
- A change that looks like an insertion at the last selection but leaves the caret before the end of the
  inserted text (some IME and script edits) is re-formatted as a whole value, so the text after the caret is
  no longer dropped.
- `maskPlaceholder` validation for masks with escaped characters counts the parsed mask: `mask={"\\99"}` accepts
  `maskPlaceholder="9_"` and rejects `"9__"` (was the other way round).

### Internal
- Property-based tests (fast-check) for the mask core: formatting, typing, paste, deletion, selections and the
  caret on every preset, a curated set of masks and generated masks. Known divergences are pinned in
  `tests/property/known.test.ts` for a follow-up fix release.
- The pins and property exclusions for the divergences fixed above are removed; the remaining pins cover
  custom masks only, plus a by-design pin for typing the prefix key by key. The generator now also produces string masks with a full `maskPlaceholder`.

## 2.8.0

### Fixed
- Autofill (or any programmatic change) over a partly typed value now replaces it. Before, the new text was
  spliced in at the caret the field had when it was left (`+7 (701) ___…` + autofill → `+7 (701) 765-43-__`).
  Edits the last selection cannot explain (an IME rewrite in the middle, drag-and-drop) are re-formatted as
  a whole value, with the caret on the first empty slot.
- A partial international number with a leading `+` fills the right slots in `uzPhone`, `kgPhone`, `kzPhone`
  and any custom `+` mask (`+998 90 123 45 6` → `+998 (90) 123-45-6_`, was `+998 (89) 012-34-56`).
- Behavior change: with a leading `+` and the country code, extra trailing characters (an extension, a typo)
  are dropped from the end instead of the start (`+7 701 123 45 67 доб. 12` → `+7 (701) 123-45-67`). Values
  without `+` are unchanged.

### Internal
- Prefix heuristics for prefixed masks (`+998 (`, `+7 (7`, `KZ…`) moved from `MaskUtils` into
  `src/core/prefix.ts` behind a small host interface, with a table test pinning every rule. Behavior unchanged.
- The e2e suite runs in Chromium and Firefox. New paste and autofill coverage for the prefixed phone presets,
  card, IBAN, a date mask and `useMask`.

## 2.7.2

### Fixed
- `useMask`: typing or pasting over a selected value now replaces it instead of appending (the hook did
  not track the selection). Its deprecation warnings now match `InputMask`'s and link to the migration guide.
- `useMask`: in Firefox, tabbing into an empty prefixed field (`+7 (___) …`) no longer loses the first typed
  digit; the hook now places the caret after the browser's select-all on keyboard focus, as `InputMask` does.
- `InputMask` with `autoFocus`: the selection is tracked from mount, so select all + typing replaces the value
  right away instead of after the first blur.

### Internal
- `InputMask` and `useMask` share one masking core (`src/core/`); apart from the `autoFocus` fix above,
  `InputMask` behavior is unchanged.
- README restructured.

## 2.7.1

### Fixed
- Select all + typing a number that starts with the country code fills the right slots again in prefixed
  masks (`kzPhone`, `ruPhone`, `uzPhone`, `kgPhone`), and typing a Kazakh national number over a selection
  (`701 …`) no longer duplicates the operator `7` (`+7 (770) …`). Regression in 2.7.0.
- `kzPhone`: a bare 10-digit `value` starting with `77` (`"7771234567"`) is read as the national number
  (`+7 (777) 123-45-67`) instead of prefix + partial input (`+7 (771) 234-56-7_`).
- A digits-only controlled `value` that holds the same digits as the shown value keeps the shown value.

### Upgrade notes
- Over a selection, a first key that matches the prefix's next letter/digit continues the prefix, so typing a
  national number that starts with it (`uzPhone` `90 …`, `kzPhone` `777 …`) is read as the country code, as in
  2.6.0. Other national numbers (`uzPhone` `33 …`) still land after the prefix; paste is unaffected.
- The 2.7.0 note about passing a Kazakh `"7771234567"` with the country code no longer applies.

## 2.7.0

### Fixed
- Masks that start with fixed characters (phone presets `kzPhone`, `ruPhone`, `uzPhone`, `kgPhone`,
  IBAN presets, custom masks like `+1 (999) …`): pasted text containing the country code or a domestic
  trunk prefix (`+998 90 123 45 67`, `8 912 345-67-89`, `0555 12 34 56`) now fills the right slots.
- `value` given as the bare national number (`"901234567"`) or an international number
  (`"+998901234567"`, `"89123456789"`) now formats correctly for such masks (`InputMask` and `useMask`).

### Changed
- For masks with a fixed prefix, pasted text **and programmatic values** longer than the mask keep their last
  characters instead of their first ones (e.g. `value="9989012345678"` → `+998 (01) 234-56-78`). Masks
  without a fixed prefix (dates, cards, plates) are unchanged.
- Replacing the whole value of a prefixed mask (select all + paste/type) now inserts after the prefix, so
  select-all + typing or pasting a national number works; typing the country code key by key over a selection
  (`9`, `9`, `8`, …) is read as the national number.

### Upgrade notes
- Pasted text and values longer than a prefixed mask keep their **last** characters.
- Replacing the whole value (select all + paste/type) inserts after the prefix; typing the country code
  key by key over a selection is read as the national number.
- The legacy v2 `beforeMaskedValueChange` callback now receives `userInput` with the country/trunk prefix
  already removed (e.g. `"91 765 43 21"` for a pasted `"+998 91 765 43 21"`).
- A controlled value that consists only of digits is read as "prefix digits + what was typed" when it
  starts with the prefix digits (`"998901…"`), so a bare national number that itself starts with them
  (e.g. a Kazakh `"7771234567"`) should be passed with the country code (`"+77771234567"`) or formatted.

## 2.6.0

Additive release — no migration required.

### Added
- Kyrgyzstan preset pack in `react-input-mask-format/presets`: `kgPhone` (domestic leading 0 is skipped), `kgInnPerson`, `kgInnCompany`, `kgAccount`, `kgBik`, `kgPlate`, `kgPlateCompany`, `kgPostal`, `kgPassport`.
- Kyrgyz validators in `react-input-mask-format/validators`: `isValidKgAccount` (NBKR MOD-97), `isValidKgInn` (structure and embedded date; check digit not verified), `isValidKgBik` (format).
- Demo: Kyrgyzstan tab in the country switcher.

## 2.5.0

Additive release — no migration required.

### Added
- Uzbekistan preset pack in `react-input-mask-format/presets`: `uzPhone`, `uzPinfl`, `uzInn`, `uzAccount`, `uzMfo`, `uzPlate`, `uzPlateCompany`, `uzPostal`, `uzPassport`.
- Uzbek validators in `react-input-mask-format/validators`: `isValidUzPinfl` (official 7-3-1 checksum, sex/century digit and birth date), `isValidUzInn` (format only).
- Demo: Uzbekistan tab in the country switcher.

## 2.4.0

Additive release — no migration required.

### Added
- Russia preset pack in `react-input-mask-format/presets`: `ruPhone`, `ruInnPerson`, `ruInnCompany`, `ruSnils`, `ruOgrn`, `ruOgrnip`, `ruKpp`, `ruBik`, `ruAccount`, `ruIban`, `ruPlate` (Latin input → Cyrillic), `ruPostal`, `ruPassport`.
- Russian validators in `react-input-mask-format/validators`: `isValidRuInn`, `isValidRuSnils`, `isValidRuOgrn`, `isValidRuOgrnip`, `isValidRuAccount` (control key with BIK), `isValidRuIban`, `isValidRuPlate`, `isValidRuKpp`, `isValidRuBik` (format).
- Demo: country switcher (KZ / RU).

### Changed
- Presets and validators sources are organised per country; public imports are unchanged.

## 2.3.0

Additive release — no migration required.

### Added
- `react-input-mask-format/time` — HH:MM (24h) masked input with clamping: `<TimeFormat>` component, `useTimeFormat` ref hook, `formatTime` / `parseTime` helpers.

## 2.2.0

Additive release — no migration required.

### Added
- **`useMask` hook** (main entry) — ref-based masking for your own `<input>`, no wrapper component. Uncontrolled; fires your `onChange` with the masked value.
- **`react-input-mask-format/number`** — numeric/currency masking as a separate, tree-shakeable entry:
  - `<NumberFormat>` — controlled component with `react-number-format`-compatible props and an `onValueChange({ value, formattedValue, floatValue })` callback.
  - `useNumberFormat` — ref hook (uncontrolled) counterpart.
  - `formatNumber` / `parseNumber` — pure helpers.

Existing `<InputMask>`, `/presets`, and `/validators` are unchanged.

## 2.1.0

### Added
- `transform` prop on `InputMask` (`"uppercase"` | `"lowercase"` | `(char, position) => char`).
- RegExp values in `formatChars` (string values deprecated) and a shipped `extendedFormatChars` map (`A`, `Я`, `#`).
- `react-input-mask-format/presets`: `card`, `kzPhone`, `kzIin`, `kzBin`, `kzIban`, `kzPlate`, `kzPostal`.
- `react-input-mask-format/validators`: `isValidIin`, `isValidBin`, `isValidKzIban`, `luhn`.
- Redesigned demo showcase.

### Notes
- Fully backward compatible; default tokens (`9`, `a`, `*`) unchanged.

## 2.0.0

First release after four years. The library is maintained again.

### Breaking

- Package now ships ESM + CJS through the `exports` field. Deep imports
  (`react-input-mask-format/lib/...`) are no longer available — import the
  package root.
- `prop-types` runtime validation removed in favor of TypeScript types.
  `prop-types`, `invariant` and `warning` dependencies dropped — the package
  now has zero runtime dependencies.
- `react-dom` removed from `peerDependencies` (it was never used at runtime).

### Fixed

- **React 19**: default values for `maskPlaceholder` ("_") and
  `alwaysShowMask` (false) no longer rely on `defaultProps`, which React 19
  ignores on function components.
- **StrictMode / concurrent rendering**: controlled value formatting is now
  computed purely during render; refs and DOM are only mutated in layout
  effects.
- Custom children support restored — passing a component as children
  crashed on mount in every release since findDOMNode removal (v1.0.x).

### Added

- TypeScript source; types (`InputMaskProps`, `InputState`, `Selection`,
  `BeforeMaskedStateChangeFn`, `Mask`) are generated from code.
- v2 API compatibility layer: `maskChar`, `formatChars`,
  `beforeMaskedValueChange` work as deprecated aliases with a one-time
  development warning.
- Vitest + Testing Library unit/component suites (48 tests), 6 Playwright
  caret e2e tests, GitHub Actions CI with a React 17/18/19 matrix,
  size-limit budget (≤ 6 KB), npm provenance publishing.

## 1.0.5 and earlier

See git history.
