# Plan 005: Replace `"latest"` version pins with concrete ranges for @tanstack packages

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written before the project had
> a git repository (see `plans/001-init-git-repo.md`). If a commit SHA
> exists, run `git diff --stat <SHA>..HEAD -- package.json package-lock.json`.
> If it shows changes, compare the "Current state" excerpt below against
> the live file before proceeding; on a mismatch — in particular, if the
> currently-installed versions differ from those listed below — re-derive
> the target versions with the commands in Step 1 rather than trusting the
> numbers in this plan.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dependencies
- **Planned at**: no git repository yet — written 2026-07-11

## Why this matters

`package.json` pins **8** `@tanstack/*` packages to the literal string
`"latest"` instead of a semver range. This was almost certainly the shadcn
scaffold's default, not a deliberate choice. The risk: `"latest"` in a
manifest is not a version constraint — every fresh `npm install` (a new
clone, a CI runner without a cached `node_modules`, or a future
`package-lock.json` regeneration) re-resolves to whatever is newest *at
install time*, with no guarantee it matches what's currently installed and
tested. A breaking TanStack Router/Start release could land in this
project silently, with nothing in the diff to explain why the build broke.
The lockfile already recorded concrete, working versions — this plan just
makes the manifest agree with reality.

## Current state

- `package.json` (52 lines), full current content:

```json
{
  "name": "treino-friends",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev --port 3000",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "lint": "eslint",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx}\"",
    "check": "prettier --check \"**/*.{ts,tsx,js,jsx}\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fontsource-variable/inter": "^5.2.8",
    "@tailwindcss/vite": "^4",
    "@tanstack/react-devtools": "latest",
    "@tanstack/react-router": "latest",
    "@tanstack/react-router-devtools": "latest",
    "@tanstack/react-router-ssr-query": "latest",
    "@tanstack/react-start": "latest",
    "@tanstack/router-plugin": "latest",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.24.0",
    "radix-ui": "^1.6.2",
    "react": "^19.2.6",
    "react-dom": "^19.2.6",
    "shadcn": "^4.13.0",
    "tailwind-merge": "^3.6.0",
    "tailwindcss": "^4",
    "tw-animate-css": "^1.4.0"
  },
  "devDependencies": {
    "@tanstack/devtools-vite": "latest",
    "@tanstack/eslint-config": "latest",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6",
    "eslint": "^9",
    "jsdom": "^28",
    "prettier": "^3.8.3",
    "prettier-plugin-tailwindcss": "^0.8.0",
    "typescript": "^6",
    "vite": "^8",
    "vitest": "^4"
  }
}
```

- The **8** packages pinned to `"latest"` and the versions actually
  resolved in `node_modules` at the time this plan was written (verify
  these are still current with Step 1's command before using them — do not
  hardcode these numbers if they've drifted):
  - `@tanstack/react-devtools` — resolved `0.10.8`
  - `@tanstack/react-router` — resolved `1.170.17`
  - `@tanstack/react-router-devtools` — resolved `1.167.0`
  - `@tanstack/react-router-ssr-query` — resolved `1.167.1`
  - `@tanstack/react-start` — resolved `1.168.27`
  - `@tanstack/router-plugin` — resolved `1.168.19`
  - `@tanstack/devtools-vite` (devDependency) — resolved `0.8.1`
  - `@tanstack/eslint-config` (devDependency) — resolved `0.4.0`
- Every **other** dependency in the manifest already uses a proper caret
  range (`^19.2.6`, `^4`, etc.) — this plan brings the 8 stragglers in
  line with that existing convention, it does not introduce a new one.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Confirm currently-resolved version | `node -p "require('./node_modules/@tanstack/<pkg>/package.json').version"` | prints a version string |
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Confirm no unintended upgrade happened | `npm ls @tanstack/react-router @tanstack/react-start` (etc., or read `package-lock.json`) | same version numbers as before the edit |

## Scope

**In scope** (the only file you should modify):
- `package.json`

**Out of scope**:
- Do **not** run `npm install` in a way that would let npm re-resolve to a
  *newer* version than what's currently installed — the goal is to pin the
  manifest to what's already working, not to upgrade anything. If your
  environment requires running `npm install` after editing `package.json`
  to regenerate `package-lock.json`'s manifest-consistency fields, use
  `npm install --package-lock-only` or verify with `npm ls` afterward that
  no version numbers changed (see Step 3).
- Do not touch any non-`@tanstack` dependency.
- Do not modify `package-lock.json` by hand.

## Git workflow

- Branch: `plans/005-pin-tanstack-dependencies` (if git exists; see
  plan 001).
- Commit message: `chore: pin @tanstack packages to concrete versions instead of "latest"`

## Steps

### Step 1: Re-confirm the currently-resolved version of each package

Do not trust the version numbers listed in "Current state" without
re-checking — they may have drifted if `npm install` ran again since this
plan was written. Run, for each of the 8 packages:

```bash
node -p "require('./node_modules/@tanstack/react-devtools/package.json').version"
node -p "require('./node_modules/@tanstack/react-router/package.json').version"
node -p "require('./node_modules/@tanstack/react-router-devtools/package.json').version"
node -p "require('./node_modules/@tanstack/react-router-ssr-query/package.json').version"
node -p "require('./node_modules/@tanstack/react-start/package.json').version"
node -p "require('./node_modules/@tanstack/router-plugin/package.json').version"
node -p "require('./node_modules/@tanstack/devtools-vite/package.json').version"
node -p "require('./node_modules/@tanstack/eslint-config/package.json').version"
```

**Verify**: each prints a version string (e.g. `1.170.17`). Use these
exact values (not the ones in this plan's "Current state" section, in case
they've drifted) for Step 2.

### Step 2: Replace `"latest"` with a caret range at the confirmed version

Edit `package.json`. For each of the 6 entries under `"dependencies"`,
replace `"latest"` with `"^<confirmed-version>"`. For example, if Step 1
confirmed `@tanstack/react-router` is `1.170.17`:

```json
"@tanstack/react-router": "^1.170.17",
```

Do the same for `@tanstack/react-devtools`, `@tanstack/react-router-devtools`,
`@tanstack/react-router-ssr-query`, `@tanstack/react-start`, and
`@tanstack/router-plugin` under `"dependencies"`, and for
`@tanstack/devtools-vite` and `@tanstack/eslint-config` under
`"devDependencies"`.

Use `^` (caret), matching the convention every other entry in this file
already uses — not `~` or an exact pin — so routine patch/minor updates
within the same major version remain possible via normal `npm update`.

**Verify**: `grep -c '"latest"' package.json` → `0`.

### Step 3: Confirm no version actually changed

```bash
npm install --package-lock-only
git diff package-lock.json   # if git exists; otherwise inspect manually
```

**Verify**: the diff (or manual inspection) shows `package-lock.json`'s
top-level `dependencies`/`devDependencies` blocks now recording explicit
`^x.y.z` ranges instead of `"latest"` for these 8 packages, but the
resolved `version` fields for these packages elsewhere in the lockfile are
**unchanged** from Step 1's values. If any resolved version changed, that
means the caret range in Step 2 allowed a newer version to resolve — that
should not happen if you used the exact confirmed version from Step 1 as
the range's base, but double-check.

### Step 4: Full static verification

```bash
npm run typecheck
npm run lint
npm run build
```

**Verify**: all three exit 0, matching pre-change behavior (this is a
manifest-only change; nothing about the app's runtime behavior should
differ).

## Test plan

No new tests — this is a manifest/metadata change with no runtime logic to
test. Verification is: the app still typechecks, lints, and builds
identically (Step 4), and no dependency version actually moved (Step 3).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c '"latest"' package.json` → `0`
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] No package's resolved version in `package-lock.json` changed as a
      result of this plan (Step 3)
- [ ] Only `package.json` (and `package-lock.json`'s manifest-consistency
      fields, via `--package-lock-only`) are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `package.json` doesn't match the "Current state" excerpt above (e.g. a
  different set of packages is pinned to `"latest"`, or the file has
  otherwise changed).
- Any package's resolved version changes as a result of this plan — the
  goal is pinning to the *current* working version, not upgrading, so any
  drift here means the caret range was set incorrectly.
- `npm run build` or `npm run typecheck` fail after this change — a
  manifest-only edit to add version constraints should never change
  build/type behavior; a failure here means something unexpected happened
  and needs investigation before continuing.

## Maintenance notes

- Future TanStack upgrades now require an explicit `package.json` edit (or
  `npm install @tanstack/react-router@latest` etc., deliberately) instead
  of happening silently on a fresh install — this is the intended
  behavior change from this plan.
- If this project ever adds a CI pipeline (currently none exists), a
  `npm ci` step there will now reliably reproduce the exact dependency
  tree recorded in the lockfile, which was not guaranteed before this
  plan.
