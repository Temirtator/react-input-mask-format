# Changelog

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
