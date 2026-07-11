# Plan 001: Initialize git version control for the project

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written when the project had
> **no git repository at all**. Run `git rev-parse --short HEAD` from the
> project root — if it prints a short SHA instead of failing with
> `fatal: not a git repository`, someone has already initialized git since
> this plan was written. Treat that as a STOP condition: read the existing
> `.git` history and re-scope this plan (or skip it) instead of re-running
> `git init` blindly.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: no git repository exists yet (this plan establishes it) — written 2026-07-11

## Why this matters

The entire project — a working app, a 36-clip audio dataset, and the
processing that produced it — currently has zero version history. There is
no rollback point, no way to diff a future change against a known-good
state, and no foundation for any tooling (CI, code review, other plans'
drift checks) that assumes git. The project's own shadcn scaffold config
(`.cta.json`) recorded `"git": true` as the intent, but no repository was
ever created. This plan fixes that with a single clean baseline commit.

## Current state

- The project root: `/Users/geldopc/Documents/nerdzilla/treino_friends`
  (this plan assumes the executor's working directory is already there or
  is told the equivalent path).
- `git rev-parse --short HEAD` → `fatal: not a git repository (or any of the
  parent directories): .git`
- `.gitignore` already exists at the project root with reasonable content:
  ```
  node_modules
  .DS_Store
  dist
  dist-ssr
  *.local
  .env*
  .tanstack
  .wrangler
  .output
  .vinxi
  __unconfig*
  todos.json

  # typescript
  *.tsbuildinfo
  ```
  It does **not** yet ignore `.playwright-mcp/` (see Step 1 below).
- A `.playwright-mcp/` directory exists at the project root, created by
  manual browser-testing tool calls during development (screenshots and
  console logs, ~336KB, 9 files). It is debug output, not part of the app,
  and must not become part of the first commit.
- `.cta.json` (the shadcn scaffold's recorded init config) contains
  `"git": true` — confirming git was always the intended setup, just never
  executed.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Check git state | `git rev-parse --short HEAD` | fails with "not a git repository" (pre-condition for this plan) |
| Init | `git init` | `Initialized empty Git repository in .../.git/` |
| Status | `git status` | shows untracked files, `.playwright-mcp/` NOT listed after Step 1 |
| Typecheck (sanity, not git-related) | `npm run typecheck` | exit 0 |

## Scope

**In scope** (the only files you should modify/create):
- `.gitignore` (append one line)
- `.git/` (created by `git init`)
- The initial commit itself (all currently-tracked-worthy files)

**Out of scope**:
- Do not delete `.playwright-mcp/` — just gitignore it. It may still be
  useful local debug output for the person who created it; removing files
  is not this plan's job.
- Do not touch any application source file (`src/`, `public/`).
- Do not push to any remote — none is configured, and none should be
  created by this plan.

## Git workflow

- This plan creates the repository itself, so there is no existing branch
  convention to match yet. Commit directly to whatever the default branch
  name is (`git init` default, typically `main`).
- Single commit for this plan. Message: `chore: initialize git repository`

## Steps

### Step 1: Ignore local debug/tooling artifacts before the first commit

Open `.gitignore` and add a new line at the end:

```
.playwright-mcp/
```

**Verify**: `cat .gitignore | tail -1` → `.playwright-mcp/`

### Step 2: Initialize the repository

```bash
git init
```

**Verify**: `git rev-parse --short HEAD` still fails (no commits yet), but
`git status` succeeds and no longer errors with "not a git repository".

### Step 3: Stage everything and confirm nothing unwanted is included

```bash
git add -A
git status
```

**Verify**: Read the full `git status` output.
- `.playwright-mcp/` must **not** appear in the staged list.
- `node_modules/`, `dist/`, `.tanstack/` must **not** appear (already
  covered by existing `.gitignore` entries).
- `public/audios/*.mp3` (36 files) **should** appear staged — they are
  the app's actual data, not build output, and belong in the repository.
- If any of the following look like they contain secrets, STOP and report
  instead of committing: any `.env*` file that isn't already gitignored,
  any file with "key", "token", "secret", or "credential" in its name that
  you don't recognize as expected project content. This project has no
  backend and no known secrets, so none are expected — treat any
  unexpected finding here as a STOP condition, not something to just
  exclude and continue.

### Step 4: Make the baseline commit

```bash
git commit -m "chore: initialize git repository"
```

**Verify**: `git log --oneline -1` → one line showing the commit you just
made. `git rev-parse --short HEAD` now succeeds and prints a short SHA.

## Test plan

No new test files — this plan is pure repository setup and has no
application logic to test. The verification is git state itself.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `git rev-parse --short HEAD` exits 0 and prints a short SHA
- [ ] `git log --oneline` shows exactly one commit
- [ ] `git status` shows a clean working tree (`nothing to commit, working tree clean`)
- [ ] `git show --stat HEAD | grep -c '.playwright-mcp'` → `0`
- [ ] `npm run typecheck` still exits 0 (sanity check that nothing broke)
- [ ] `plans/README.md` status row for 001 updated

## STOP conditions

Stop and report back (do not improvise) if:

- `git rev-parse --short HEAD` succeeds *before* you run `git init` (see
  the drift check at the top of this plan).
- `git status` after `git add -A` shows anything that looks like a secret,
  credential, or `.env` file not already gitignored.
- The staged file list includes `.playwright-mcp/`, `node_modules/`,
  `dist/`, or `.tanstack/` after Step 1 — the `.gitignore` edit didn't
  take effect as expected; investigate before committing.

## Maintenance notes

- Every subsequent plan in this `plans/` directory was written assuming
  this plan runs first (or at least before any of them are executed) — it
  is the natural prerequisite for meaningful `git diff`-based drift checks
  in plans 002–007, even though none of them hard-depend on it to execute
  their own file changes.
- Whoever executes plans 002–007 after this one should update their
  "Drift check" step to use a real `git diff --stat <SHA>..HEAD` once a SHA
  is available — those plans were written before this repository existed,
  so their drift-check sections say so explicitly.
- No remote is configured by this plan. If/when the user wants to push to
  GitHub or elsewhere, that's a separate, explicit action — do not add a
  remote or push proactively.
