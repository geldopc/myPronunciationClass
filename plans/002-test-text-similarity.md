# Plan 002: Add unit tests for the pronunciation-scoring logic and fix the broken test gate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written before the project had
> a git repository (see `plans/001-init-git-repo.md`). If plan 001 has run,
> a commit SHA now exists — run
> `git diff --stat <SHA-after-001>..HEAD -- src/lib/text-similarity.ts`.
> If it shows changes, compare the "Current state" excerpt below against the
> live file before proceeding; on a mismatch, treat it as a STOP condition.
> If plan 001 has *not* run yet, just diff the file's current content
> against the excerpt below by eye.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (plan 001 recommended first for clean history, not required)
- **Category**: tests
- **Planned at**: no git repository yet — written 2026-07-11

## Why this matters

`npm run test` currently exits with code 1 because zero test files exist in
the project, even though `vitest` and `@testing-library/react` are already
installed as devDependencies. Worse, the one piece of logic this app's core
feature depends on — turning a spoken transcript into a 0–100% pronunciation
score — has never been verified by anything. `src/lib/text-similarity.ts`
exports three pure, deterministic functions
(`normalizeSpeechText`, `levenshteinDistance`, `getSimilarityPercentage`)
that are ideal, cheap to test, and currently completely unverified. A future
edit to the normalization regex or the distance formula could silently
change what score a learner sees, with nothing to catch it.

## Current state

- `src/lib/text-similarity.ts` (53 lines), full current content:

```ts
/**
 * Normalizes strings before comparing speech-recognition output with a target
 * sentence. Accents, case, punctuation, and extra spaces do not affect score.
 */
export function normalizeSpeechText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinDistance(first: string, second: string): number {
  if (first === second) return 0;
  if (!first) return second.length;
  if (!second) return first.length;

  let previousRow = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const currentRow = [firstIndex];

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitutionCost =
        first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;

      currentRow[secondIndex] = Math.min(
        currentRow[secondIndex - 1] + 1,
        previousRow[secondIndex] + 1,
        previousRow[secondIndex - 1] + substitutionCost,
      );
    }

    previousRow = currentRow;
  }

  return previousRow[second.length];
}

/** Returns an integer percentage from 0 through 100. */
export function getSimilarityPercentage(target: string, transcript: string): number {
  const normalizedTarget = normalizeSpeechText(target);
  const normalizedTranscript = normalizeSpeechText(transcript);

  if (!normalizedTarget || !normalizedTranscript) return 0;

  const longestText = Math.max(normalizedTarget.length, normalizedTranscript.length);
  const distance = levenshteinDistance(normalizedTarget, normalizedTranscript);

  return Math.round((1 - distance / longestText) * 100);
}
```

- `package.json` test script: `"test": "vitest run"`. No `vitest.config.ts`
  exists and `vite.config.ts` has no `test` block, so vitest runs with
  **default config**: globals are OFF (you must `import { describe, it,
  expect } from "vitest"` explicitly in every test file — do not assume
  `describe`/`it`/`expect` are ambient globals), default `include` glob is
  `**/*.{test,spec}.?(c|m)[jt]s?(x)`.
- Installed test tooling (from `package.json` devDependencies, already
  present, do not add anything new): `vitest ^4`, `@testing-library/react
  ^16.3.2`, `@testing-library/dom ^10.4.1`, `jsdom ^28`.
- Repo convention: this codebase has no existing test files to pattern-match
  against (that's the point of this plan) — follow standard vitest
  conventions: co-located `*.test.ts` next to the source file.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Run tests | `npm run test` | exit 0, shows passing test count, no "No test files found" |
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 |

## Scope

**In scope** (the only files you should modify/create):
- `src/lib/text-similarity.test.ts` (create)

**Out of scope**:
- Do not modify `src/lib/text-similarity.ts` itself — this plan adds tests
  for the *existing* behavior, it does not change the scoring algorithm.
  If while writing tests you find what looks like a bug in the algorithm,
  STOP and report it rather than "fixing" it here (that's a separate,
  reviewable change).
- Do not add a `vitest.config.ts` or modify `vite.config.ts` — the default
  config is sufficient for testing pure functions with no DOM dependency.
- Do not touch any component file (`PhraseCard`, `ListeningSpeakingApp`) —
  those are out of scope for this plan (see plans 003/004 for their fixes).

## Git workflow

- Branch: if plan 001 has run, work on a branch named
  `plans/002-test-text-similarity` off the default branch. If plan 001
  has not run yet (no git repo exists), skip branching — just make the
  file changes; whoever runs plan 001 later will include this work in the
  initial commit, or you can suggest the user run plan 001 first.
- Commit message (once git exists): `test: add coverage for text-similarity scoring`

## Steps

### Step 1: Write the test file

Create `src/lib/text-similarity.test.ts`. Import from `"vitest"` explicitly
(globals are not enabled) and from the module under test using a relative
import (`from "./text-similarity"`) since it's a same-directory test file.

Cover at minimum these cases, across the three exported functions:

**`normalizeSpeechText`**
- Lowercases: `"HELLO"` → `"hello"`.
- Strips accents: `"café"` → `"cafe"`.
- Strips punctuation, keeps words: `"Hey, you're back!"` → `"hey you re back"`
  (apostrophe is stripped by the `[^a-z0-9\s]` filter — verify this is the
  actual behavior by reasoning through the regex, not by guessing; write
  the assertion to match what the code actually does).
- Collapses whitespace: `"hello    world"` → `"hello world"`.
- Trims leading/trailing whitespace.

**`levenshteinDistance`**
- Identical strings → `0`.
- Empty first string → returns `second.length`.
- Empty second string → returns `first.length`.
- One substitution: `"cat"` vs `"bat"` → `1`.
- One insertion: `"cat"` vs `"cats"` → `1`.
- Known classic case: `"kitten"` vs `"sitting"` → `3`.

**`getSimilarityPercentage`**
- Exact match (after normalization) → `100`.
- Completely different short strings → a low score (assert `< 50`, not an
  exact number, since the precise value is an implementation detail of the
  formula).
- Empty target or empty transcript → `0` (per the explicit early return in
  the code).
- Case/punctuation-insensitive: `getSimilarityPercentage("Hello!", "hello")`
  → `100` (normalization should make these equivalent).
- A realistic near-miss: pick a real phrase from `src/lib/phrases.ts` (e.g.
  `"Hi. Hey, you're back, too. Yeah."` from `id: 6`) and a transcript with
  one word changed or missing, and assert the score lands in a reasonable
  band (e.g. `>= 70` for a one-word miss in a longer sentence) rather than
  asserting an exact number — the point is to lock in *behavior*, not an
  arbitrary precise value that would make the test brittle.

**Verify**: `npm run test -- text-similarity` → all new tests pass, no
failures, no "No test files found" message.

### Step 2: Confirm the whole-suite test command is fixed

```bash
npm run test
```

**Verify**: exit code 0, output shows the new test file executed with all
tests passing, and the output no longer contains "No test files found".

### Step 3: Confirm nothing else broke

```bash
npm run typecheck
npm run lint
```

**Verify**: both exit 0.

## Test plan

(This plan's entire content *is* the test plan — see Step 1 above for the
full case list.) No existing test file in this repo to pattern-match
against; follow standard vitest conventions (explicit imports from
`"vitest"`, `describe`/`it`/`expect` blocks, one `describe` per exported
function).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run test` exits 0
- [ ] `src/lib/text-similarity.test.ts` exists and contains at least one
      `describe` block per exported function (3 total)
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] No files outside `src/lib/text-similarity.test.ts` are modified
      (`git status` / `git diff --stat`, once git exists — otherwise
      confirm by listing the files you touched)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `src/lib/text-similarity.ts` doesn't match the "Current
  state" excerpt above — the file has drifted since this plan was written.
- Writing a test reveals what looks like an actual bug in the scoring
  logic (e.g. a case where the score doesn't behave as a reasonable person
  would expect). Report it instead of fixing `text-similarity.ts` — that
  file is explicitly out of scope for this plan.
- `npm run test` still shows "No test files found" after Step 1 — the
  vitest `include` glob may not be matching your file's name/location;
  double-check the filename ends in `.test.ts`.

## Maintenance notes

- This is the first test file in the repository. Whoever adds the next one
  should follow the same conventions (explicit `vitest` imports, co-located
  `*.test.ts`).
- If `PhraseCard`/`ListeningSpeakingApp` ever get tests (not in scope
  here), they will need `jsdom` as the test environment — that requires
  either a `vitest.config.ts` with `test.environment: "jsdom"` or an
  `@vitest-environment jsdom` docblock per file, since the current default
  vitest environment is Node, not jsdom, despite `jsdom` being installed.
  This plan's tests are pure-function tests with no DOM, so they don't need
  this — but it's the natural next gap once component tests are added.
