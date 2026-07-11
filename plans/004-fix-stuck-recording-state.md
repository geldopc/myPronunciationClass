# Plan 004: Guarantee the recording UI never gets stuck after a speech-recognition error

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: This plan was written before the project had
> a git repository (see `plans/001-init-git-repo.md`). If a commit SHA
> exists, run
> `git diff --stat <SHA>..HEAD -- src/components/PhraseCard/index.tsx`.
> If it shows changes, compare the "Current state" excerpt below against
> the live file before proceeding; on a mismatch, treat it as a STOP
> condition. If no git repo exists yet, diff by eye.
>
> **Sequencing note**: this plan and `plans/003-guard-concurrent-play-record.md`
> both touch `src/components/PhraseCard/index.tsx`. They edit different,
> non-overlapping functions (003 touches `startRecording`'s early-return
> guard and the JSX `disabled` props; this plan touches `onerror`/`onend`
> wiring). If both are being executed, run 003 first, then re-read the file
> before starting this plan's Step 1 — the line numbers below assume 003
> has NOT yet run; if it has, locate the excerpts by content, not by line
> number.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (see sequencing note above re: plan 003 touching the same file)
- **Category**: bug
- **Planned at**: no git repository yet — written 2026-07-11

## Why this matters

`PhraseCard`'s recording flow sets `isRecording` to `true` in two places
(`recognition.onstart` and the `try` block before `recognition.start()`)
but only resets it to `false` in one place: `recognition.onend`, via
`finishRecording`. The `onerror` handler sets a user-facing error message
but does **not** call `finishRecording()` — it assumes `onend` will always
fire afterward to clean up. Per the Web Speech API spec this is *usually*
true, but it is a documented cross-browser inconsistency (most notably in
Safari's `webkitSpeechRecognition` implementation) that `onend` does not
reliably fire after every `onerror`, particularly for `aborted` and some
`network`/`service-not-allowed` cases. When that happens here, the UI is
left permanently showing "Parar gravação" / "Gravando..." with a dead
`SpeechRecognition` instance underneath — the user cannot record again on
that card without reloading the page.

## Current state

- `src/components/PhraseCard/index.tsx` (202 lines). Full relevant section
  (`finishRecording` through `toggleRecording`):

```tsx
  function finishRecording() {
    setIsRecording(false)
    onRecordingChange(null)
  }

  function startRecording() {
    if (!supportsSpeechRecognition || !phraseReady) return

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!SpeechRecognitionApi) return

    setRecordingError(null)
    const recognition = new SpeechRecognitionApi()
    recognitionRef.current = recognition
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      // State is set before `start` too, so a second click cannot create a
      // concurrent recognition instance while the browser opens its prompt.
      setIsRecording(true)
      onRecordingChange(phrase.id)
    }

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      const transcript = lastResult[0].transcript.trim()

      onEvaluation(phrase.id, {
        transcript,
        score: getSimilarityPercentage(phrase.text, transcript),
      })
    }

    recognition.onerror = (event) => {
      setRecordingError(
        recognitionErrorMessages[event.error] ??
          "Não foi possível reconhecer a fala."
      )
    }

    recognition.onend = finishRecording

    try {
      setIsRecording(true)
      onRecordingChange(phrase.id)
      recognition.start()
    } catch {
      setRecordingError("A gravação já está sendo iniciada. Tente novamente.")
      finishRecording()
    }
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    startRecording()
  }
```

- The `recognitionErrorMessages` lookup table referenced above (top of the
  same file):

```tsx
const recognitionErrorMessages: Record<string, string> = {
  "audio-capture": "Nenhum microfone foi encontrado.",
  "not-allowed": "Permita o uso do microfone no navegador.",
  "service-not-allowed": "O serviço de reconhecimento não está disponível.",
  network: "Não foi possível acessar o serviço de reconhecimento.",
  "no-speech": "Não foi detectada fala. Tente novamente.",
}
```

- Note the existing `try`/`catch` around `recognition.start()` already
  calls `finishRecording()` in its `catch` block — that's the pattern to
  extend to `onerror`, not invent a new one.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Dev server (manual check) | `npm run dev` | serves on http://localhost:3000 |

## Scope

**In scope** (the only file you should modify):
- `src/components/PhraseCard/index.tsx`

**Out of scope**:
- Do not modify `recognitionErrorMessages` — the message text/keys are
  fine as-is; this plan only fixes state cleanup.
- Do not touch `src/components/ListeningSpeakingApp/index.tsx`.
- Do not add retry logic or automatic re-recording — just make the button
  state reliably return to "not recording" so the user can manually retry.

## Git workflow

- Branch: `plans/004-fix-stuck-recording-state` (if git exists; see
  plan 001).
- Commit message: `fix: always reset recording state after a speech-recognition error`

## Steps

### Step 1: Call `finishRecording()` from `onerror`, not just `onend`

In `src/components/PhraseCard/index.tsx`, change the `recognition.onerror`
handler to call `finishRecording()` after setting the error message:

```tsx
recognition.onerror = (event) => {
  setRecordingError(
    recognitionErrorMessages[event.error] ??
      "Não foi possível reconhecer a fala."
  )
  finishRecording()
}
```

This makes `onerror` self-sufficient for cleanup instead of depending on
`onend` also firing. If the browser *does* also fire `onend` afterward
(the common case), `finishRecording()` runs twice — confirm this is safe
before moving on: `finishRecording` only calls `setIsRecording(false)` and
`onRecordingChange(null)`, both idempotent (calling them a second time
with the same values is a no-op from the user's perspective). No guard is
needed for that double-call.

**Verify**: `npm run typecheck` → exit 0.

### Step 2: Static verification

```bash
npm run typecheck
npm run lint
npm run build
```

**Verify**: all three exit 0.

### Step 3: Manual verification — force an error and confirm recovery

```bash
npm run dev
```

Open http://localhost:3000 in a browser. Reproduce at least one error path
and confirm the UI recovers:

- **Easiest reproduction**: click "Gravar / Repetir" and then explicitly
  deny the microphone permission prompt (or, if already denied from a
  prior visit, it will fire immediately). This triggers the `not-allowed`
  error.
- Confirm the error message "Permita o uso do microfone no navegador."
  appears.
- Confirm the button **returns to "Gravar / Repetir"** (not stuck on
  "Parar gravação" / "Gravando...") within a second or two of the error.
- Click "Gravar / Repetir" again — confirm it attempts to start a new
  recognition (browser re-prompts for permission, or immediately errors
  again if permission is permanently blocked at the OS/browser level —
  either way, the button must not be stuck).

If you cannot reproduce a real permission-denial in your environment,
reproducing `no-speech` (start recording, then stay silent past the
browser's silence timeout) is an acceptable alternative — confirm the same
recovery behavior.

Stop the dev server afterward (`Ctrl+C`).

## Test plan

No component-test infrastructure exists in this repo yet (see
`plans/002-test-text-similarity.md`'s maintenance note on jsdom setup).
This bug is specifically about a *browser API's* firing-order guarantees
(`SpeechRecognition.onerror` vs `onend`), which are impractical to
faithfully unit-test without a real or heavily-mocked browser
implementation — Step 3's manual verification is the acceptance test for
this plan. Do not attempt to build a `SpeechRecognition` mock harness as
part of this plan; that is a larger, separate investment out of scope
here.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] Manual verification (Step 3) confirmed and reported: error message
      shown AND button returns to "Gravar / Repetir" AND a second
      recording attempt is possible without a page reload
- [ ] Only `src/components/PhraseCard/index.tsx` is modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at `src/components/PhraseCard/index.tsx` doesn't match the
  "Current state" excerpt above.
- You cannot reproduce *any* error path in your test environment (no
  microphone available, permission prompts behave unexpectedly) — report
  what you tried and let a human verify manually instead of guessing the
  fix works.
- Calling `finishRecording()` from both `onerror` and a subsequently-firing
  `onend` causes any visible glitch (e.g. a flash of incorrect UI state) —
  report it; the assumption that double-calling is harmless would be wrong
  and the fix needs a guard instead.

## Maintenance notes

- This fix makes `onerror` independently responsible for cleanup instead
  of relying on `onend` — if `SpeechRecognition` usage is ever
  refactored (e.g. extracted into a custom hook), preserve this property:
  every terminal event (`onerror`, and the `catch` around `.start()`) must
  call `finishRecording()` itself, not assume another handler will.
- A reviewer should scrutinize whether the double-`finishRecording()` call
  (once from `onerror`, potentially again from `onend`) is truly
  side-effect-free given the actual `onRecordingChange`/`setIsRecording`
  implementations at review time — this plan's reasoning holds only as
  long as those two functions stay idempotent.
