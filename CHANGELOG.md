# Changelog

## 2.7.2

### Fixed
- `useMask`: typing or pasting over a selected value now replaces it instead of appending (the hook did
  not track the selection). Its deprecation warnings now match `InputMask`'s and link to the migration guide.

### Internal
- `InputMask` and `useMask` share one masking core (`src/core/`); `InputMask` behavior is unchanged.
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
