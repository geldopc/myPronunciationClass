# Plan 007: Remove literal "..." from the practice text shown to learners

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written before the project had
> a git repository (see `plans/001-init-git-repo.md`). If a commit SHA
> exists, run `git diff --stat <SHA>..HEAD -- src/lib/phrases.ts`. If it
> shows changes, compare the "Current state" excerpt below against the live
> file before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt (content quality)
- **Planned at**: no git repository yet — written 2026-07-11

## Why this matters

`src/lib/phrases.ts` holds the 36-phrase script the app shows a learner to
read and repeat aloud. Three entries (`id: 2`, `id: 3`, `id: 31`) contain a
literal `"..."` at the start or end of the displayed `text`, carried over
from how the original video transcript marked a trailing-off line. A
learner reading the card literally sees `"It was terrible. I fought
with..."` and has no way to know those three dots aren't something to say
out loud — they're a transcription artifact, not part of the sentence. This
is a small, low-risk content fix: strip the ellipsis from the three
`text` fields (data only, no logic, no other file affected).

## Current state

- `src/lib/phrases.ts`, the three affected entries (exact current lines):

  - Line 17:
    ```ts
    { id: 2, text: "It was terrible. I fought with...", audioSrc: "/audios/frase2.mp3", pronunciationHint: "\"It was\" contrai para \"it-wuz\". \"fought with\" liga o /t/ final ao /w/." },
    ```
  - Line 18:
    ```ts
    { id: 3, text: "...my colleagues, you know, the entire time. Are you kidding?", audioSrc: "/audios/frase3.mp3", pronunciationHint: "\"Are you\" reduz para /ɚjə/ (\"ar-ya\"). \"kidding\" tem flap-t no meio." },
    ```
  - Line 46:
    ```ts
    { id: 31, text: "Man, this is unbelievable! I mean, it's great, but...", audioSrc: "/audios/frase31.mp3", pronunciationHint: "\"this is\" conecta o /s/ final ao /ɪ/. \"it's great\" junta o /s/ ao /ɡ/ sem pausa." },
    ```
- These three phrases exist because the underlying audio clips
  (`frase2.mp3`, `frase3.mp3`, `frase31.mp3`) genuinely capture a sentence
  that trails off mid-thought in the source video (documented in
  `AUDIO_CUTS.md`) — the *audio* correctly has the speaker's voice trailing
  off. The fix here is purely about what **text** is displayed/read aloud
  by the learner, not about re-cutting any audio.
- No other phrase in the file contains `"..."` — confirmed via
  `grep -c '\.\.\.' src/lib/phrases.ts` → `3` (matches exactly these three
  lines, one occurrence each).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Confirm the target lines before editing | `grep -n '\.\.\.' src/lib/phrases.ts` | exactly 3 lines: `id: 2`, `id: 3`, `id: 31` |
| Confirm the fix | `grep -c '\.\.\.' src/lib/phrases.ts` | `0` |
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |

## Scope

**In scope** (the only file you should modify):
- `src/lib/phrases.ts` — only the `text` field of entries `id: 2`, `id: 3`,
  `id: 31`.

**Out of scope**:
- Do not touch `pronunciationHint` on any entry — the hints are correct as
  written and unrelated to this fix.
- Do not touch `audioSrc` or re-cut any audio file — the audio itself is
  fine; only the displayed/spoken-aloud text changes.
- Do not touch any other phrase entry.
- Do not touch `AUDIO_CUTS.md` — it correctly documents the audio
  intervals; this plan doesn't change those.

## Git workflow

- Branch: `plans/007-remove-ellipsis` (if git exists; see plan 001).
- Commit message: `fix: remove literal ellipsis from practice text in 3 phrases`

## Steps

### Step 1: Edit phrase `id: 2` — drop the trailing `"..."`

Change:
```ts
{ id: 2, text: "It was terrible. I fought with...", audioSrc: "/audios/frase2.mp3", pronunciationHint: "\"It was\" contrai para \"it-wuz\". \"fought with\" liga o /t/ final ao /w/." },
```
to:
```ts
{ id: 2, text: "It was terrible. I fought with", audioSrc: "/audios/frase2.mp3", pronunciationHint: "\"It was\" contrai para \"it-wuz\". \"fought with\" liga o /t/ final ao /w/." },
```
(Just remove the three trailing dots after "with" — everything else on the
line, including the pronunciation hint, stays exactly as-is.)

### Step 2: Edit phrase `id: 3` — drop the leading `"..."`

Change:
```ts
{ id: 3, text: "...my colleagues, you know, the entire time. Are you kidding?", audioSrc: "/audios/frase3.mp3", pronunciationHint: "\"Are you\" reduz para /ɚjə/ (\"ar-ya\"). \"kidding\" tem flap-t no meio." },
```
to:
```ts
{ id: 3, text: "My colleagues, you know, the entire time. Are you kidding?", audioSrc: "/audios/frase3.mp3", pronunciationHint: "\"Are you\" reduz para /ɚjə/ (\"ar-ya\"). \"kidding\" tem flap-t no meio." },
```
(Remove the leading three dots AND capitalize "my" → "My" since it's now
the start of the displayed sentence. Do not change anything else on the
line.)

### Step 3: Edit phrase `id: 31` — drop the trailing `"..."`

Change:
```ts
{ id: 31, text: "Man, this is unbelievable! I mean, it's great, but...", audioSrc: "/audios/frase31.mp3", pronunciationHint: "\"this is\" conecta o /s/ final ao /ɪ/. \"it's great\" junta o /s/ ao /ɡ/ sem pausa." },
```
to:
```ts
{ id: 31, text: "Man, this is unbelievable! I mean, it's great, but", audioSrc: "/audios/frase31.mp3", pronunciationHint: "\"this is\" conecta o /s/ final ao /ɪ/. \"it's great\" junta o /s/ ao /ɡ/ sem pausa." },
```
(Just remove the three trailing dots after "but" — everything else stays.)

### Step 4: Verify no ellipsis remains and nothing else broke

```bash
grep -c '\.\.\.' src/lib/phrases.ts
npm run typecheck
npm run lint
npm run build
```

**Verify**: `grep -c` prints `0`; all three commands exit 0.

## Test plan

No test infrastructure covers `phrases.ts` content directly (it's a static
data array, not logic). Verification is the `grep` check in Step 4
confirming the ellipsis is gone, plus the standard typecheck/lint/build
gates confirming the file is still syntactically and structurally valid
(e.g. no stray unescaped quote introduced by the edit).

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `grep -c '\.\.\.' src/lib/phrases.ts` → `0`
- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] Only the `text` field of entries `id: 2`, `id: 3`, `id: 31` changed
      in `src/lib/phrases.ts` — no other field, no other entry
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The three target lines in `src/lib/phrases.ts` don't match the "Current
  state" excerpts above.
- `grep -c '\.\.\.' src/lib/phrases.ts` finds more or fewer than 3 matches
  before you start editing — that means the file has more (or fewer)
  ellipsis occurrences than this plan assumes; re-scope before proceeding.

## Maintenance notes

- If more phrases are ever added to this file from other trimmed/trailing
  video clips, apply the same rule at data-entry time: the audio may
  legitimately trail off, but the displayed `text` a learner reads aloud
  should read as a complete-enough fragment without literal ellipsis
  punctuation.
- A reviewer should double check capitalization reads naturally after this
  change — in particular phrase `id: 3`'s new leading "My colleagues..."
  should look correct now that it starts a card's `CardTitle` on its own,
  no longer preceded by phrase `id: 2`'s "...with" continuation marker.
