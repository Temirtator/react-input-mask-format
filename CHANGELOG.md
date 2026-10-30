# Changelog

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
