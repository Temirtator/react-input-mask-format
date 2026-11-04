# Contributing

Bug reports, fixes and new country presets are welcome. Please open an issue first for larger changes.

## Setup

Node 22 and npm:

```sh
npm ci
npx playwright install chromium firefox   # for the e2e tests
npm run demo                               # demo at http://localhost:5173/react-input-mask-format/
```

## Checks

Run these before opening a pull request; CI runs the same ones (unit tests also on React 17 and 18):

```sh
npm run lint
npm run typecheck
npm test              # unit, component and property tests (vitest, jsdom)
npm run build && npm run size
npm run test:e2e      # Chromium and Firefox against the demo
```

- **Property tests** (`tests/property`, fast-check) run 100 cases per property by default. Run more after a
  change in `src/core` or a new preset: `FC_NUM_RUNS=3000 npx vitest run tests/property`. A failure prints
  `seed` and `path`; replay it with `FC_SEED=<seed> FC_PATH=<path>`.
- **Size budgets** live in `package.json` (`size-limit`). Keep a change under them; raise a limit only with a
  reason in the pull request.
- **Real browsers decide.** jsdom misses caret and event-order problems that the e2e tests catch, so add an
  e2e test (`e2e/*.spec.ts`, fields from the demo) for anything about the caret, paste or focus.
- **Style:** the repository is not formatted with Prettier defaults; match the surrounding code and do not
  reformat whole files.

## Behaviour changes

Add an entry under `## Unreleased` in `CHANGELOG.md` that says what changes for users, with a before/after
example. A change in what an input shows or reports is released as a minor version, even when it fixes a bug.

## Country presets

A pack lives in `src/presets/<code>.ts` (validators in `src/validators/<code>.ts`) and is exported from the
index files. Checklist:

- Use official or primary sources for formats and checksums. Ship a checksum only when the algorithm is
  published and real numbers pass it; otherwise check the format and say so in the README.
- Show masks the way people write the numbers in that country.
- Phones: the first national slot must accept every digit of the country code (except possibly its last one),
  or typed digits walk into the prefix. Test international (`+…`), domestic (`0…`, `8…`) and national forms,
  pasted and typed; see the existing phone tests in `tests/component/presets.test.tsx`.
- Add unit rows (`tests/unit/presets.test.ts`, `tests/unit/validators.test.ts`), a demo tab
  (`demo/countries.ts`, `demo/main.tsx`) and an e2e test. The property suite picks up new presets on its own;
  run it with `FC_NUM_RUNS=3000`.
- Document the presets and their limitations in the README table for the country.

## Testing masked inputs

- Testing Library: after `setSelectionRange`, wait a frame (`await new Promise(r => requestAnimationFrame(r))`)
  before the next key.
- Playwright: click the field and wait ~50 ms before `fill()` on a field that already has text.

## Releases

Maintainers merge to `master` and push an annotated tag `vX.Y.Z`; the release workflow runs the tests and
publishes to npm with provenance.
