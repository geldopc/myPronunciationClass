# Plan 003: Stop audio playback and speech recognition from running at the same time

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
> `git diff --stat <SHA>..HEAD -- src/components/ListeningSpeakingApp/index.tsx src/components/PhraseCard/index.tsx`.
> If it shows changes, compare the "Current state" excerpts below against
> the live files before proceeding; on a mismatch, treat it as a STOP
> condition. If no git repo exists yet, diff by eye.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: no git repository yet — written 2026-07-11

## Why this matters

Nothing in the codebase stops a user from pressing "Play" while a speech
recording is in progress (or starting a recording while audio is playing).
When that happens, the phrase's own audio plays out of the speaker and
straight back into the microphone that `SpeechRecognition` is listening on,
producing a garbage transcript and a meaningless score — silently, with no
error shown, undermining the entire "speaking practice" feature this app
exists for. This is a same-card and a cross-card problem: the existing
`isAnotherPhraseRecording` prop only prevents starting a *new recording* on
a *different* card while one is active — it does nothing about the Play
button, on any card, at any time.

## Current state

- `src/components/PhraseCard/index.tsx` (202 lines). Relevant excerpt —
  the Play button has no recording-aware guard:

```tsx
      <CardFooter className="flex flex-wrap gap-2">
        <Button onClick={() => onPlay(phrase)} disabled={!phraseReady}>
          {isPlaying ? "Tocando..." : "Play"}
        </Button>
        <Button
          variant={isRecording ? "destructive" : "secondary"}
          onClick={toggleRecording}
          disabled={
            !phraseReady ||
            !supportsSpeechRecognition ||
            isAnotherPhraseRecording
          }
        >
          {isRecording ? "Parar gravação" : "Gravar / Repetir"}
        </Button>
```

  and the recording-state variables already available in this component:

```tsx
export function PhraseCard({
  phrase,
  isPlaying,
  isAnotherPhraseRecording,
  supportsSpeechRecognition,
  evaluation,
  onPlay,
  onRecordingChange,
  onEvaluation,
}: PhraseCardProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isRecording, setIsRecording] = useState(false);
```

- `src/components/ListeningSpeakingApp/index.tsx` (117 lines). Full
  relevant state and handlers:

```tsx
export function ListeningSpeakingApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playbackRate, setPlaybackRate] = useState<(typeof playbackRates)[number]>(1);
  const [playingPhraseId, setPlayingPhraseId] = useState<number | null>(null);
  const [recordingPhraseId, setRecordingPhraseId] = useState<number | null>(null);
  const [evaluations, setEvaluations] = useState<Record<number, SpeechEvaluation>>({});
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState(false);

  // ...

  async function playPhrase(phrase: Phrase) {
    audioRef.current?.pause();

    const audio = new Audio(phrase.audioSrc);
    audioRef.current = audio;
    audio.playbackRate = playbackRate;
    audio.onended = () => setPlayingPhraseId(null);
    audio.onerror = () => setPlayingPhraseId(null);

    try {
      setPlayingPhraseId(phrase.id);
      await audio.play();
    } catch {
      setPlayingPhraseId(null);
    }
  }
```

  and the render loop that passes props to each card:

```tsx
      <section id="phrase-list" aria-label="Frases para praticar" className="grid gap-4 md:grid-cols-2">
        {phrases.map((phrase) => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            isPlaying={playingPhraseId === phrase.id}
            isAnotherPhraseRecording={
              recordingPhraseId !== null && recordingPhraseId !== phrase.id
            }
            supportsSpeechRecognition={supportsSpeechRecognition}
            evaluation={evaluations[phrase.id]}
            onPlay={playPhrase}
            onRecordingChange={setRecordingPhraseId}
            onEvaluation={saveEvaluation}
          />
        ))}
      </section>
```

- Key fact: `ListeningSpeakingApp` already tracks **both**
  `playingPhraseId` and `recordingPhraseId` as sibling pieces of state, so
  it has everything needed to know "is *anything* recording right now" and
  "is *anything* playing right now" — the fix is to thread that knowledge
  into the disabled conditions on both buttons, in both directions.

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |
| Dev server (manual check) | `npm run dev` | serves on http://localhost:3000 |

## Scope

**In scope** (the only files you should modify):
- `src/components/ListeningSpeakingApp/index.tsx`
- `src/components/PhraseCard/index.tsx`

**Out of scope**:
- Do not change the scoring logic in `src/lib/text-similarity.ts`.
- Do not change the `Select`/playback-rate logic — unrelated to this bug.
- Do not add a global "stop everything" button or any other new UI element
  beyond disabling the existing buttons appropriately — keep the fix
  minimal and behavior-preserving except for the concurrency guard itself.

## Git workflow

- Branch: `plans/003-guard-concurrent-play-record` (if git exists; see
  plan 001).
- Commit message: `fix: prevent audio playback and recording from overlapping`

## Steps

### Step 1: Track "is anything recording" and "is anything playing" as booleans in `ListeningSpeakingApp`

In `src/components/ListeningSpeakingApp/index.tsx`, derive two booleans from
the existing state (no new `useState` needed — these are derived values):

```tsx
const isAnyPhrasePlaying = playingPhraseId !== null;
const isAnyPhraseRecording = recordingPhraseId !== null;
```

Place these directly above the `return (` statement, alongside the existing
component body.

**Verify**: `npm run typecheck` → exit 0 (no unused-variable errors yet,
since Step 2 will consume them).

### Step 2: Pass the new booleans down and stop starting a recording while audio plays

Still in `ListeningSpeakingApp/index.tsx`, in `playPhrase`, refuse to start
playback if a recording is active. Modify the top of `playPhrase`:

```tsx
async function playPhrase(phrase: Phrase) {
  if (recordingPhraseId !== null) return;

  audioRef.current?.pause();
  // ...rest unchanged
```

And pass the two new booleans as props to `PhraseCard` in the render loop:

```tsx
<PhraseCard
  key={phrase.id}
  phrase={phrase}
  isPlaying={playingPhraseId === phrase.id}
  isAnotherPhraseRecording={
    recordingPhraseId !== null && recordingPhraseId !== phrase.id
  }
  isAnyPhrasePlaying={isAnyPhrasePlaying}
  isAnyPhraseRecording={isAnyPhraseRecording}
  supportsSpeechRecognition={supportsSpeechRecognition}
  evaluation={evaluations[phrase.id]}
  onPlay={playPhrase}
  onRecordingChange={setRecordingPhraseId}
  onEvaluation={saveEvaluation}
/>
```

**Verify**: `npm run typecheck` → will now show an error that `PhraseCard`
doesn't accept `isAnyPhrasePlaying`/`isAnyPhraseRecording` props yet — that
is expected until Step 3 updates `PhraseCardProps`. Continue to Step 3
before re-checking.

### Step 3: Accept the new props in `PhraseCard` and wire them into both buttons' `disabled`

In `src/components/PhraseCard/index.tsx`, add the two new props to
`PhraseCardProps`:

```tsx
type PhraseCardProps = {
  phrase: Phrase;
  isPlaying: boolean;
  isAnotherPhraseRecording: boolean;
  isAnyPhrasePlaying: boolean;
  isAnyPhraseRecording: boolean;
  supportsSpeechRecognition: boolean;
  evaluation?: SpeechEvaluation;
  onPlay: (phrase: Phrase) => void;
  onRecordingChange: (phraseId: number | null) => void;
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void;
};
```

Destructure them in the component signature (add to the existing
destructured parameters):

```tsx
export function PhraseCard({
  phrase,
  isPlaying,
  isAnotherPhraseRecording,
  isAnyPhrasePlaying,
  isAnyPhraseRecording,
  supportsSpeechRecognition,
  evaluation,
  onPlay,
  onRecordingChange,
  onEvaluation,
}: PhraseCardProps) {
```

Update `startRecording` to refuse to start if audio is currently playing —
add this check right after the existing early return:

```tsx
function startRecording() {
  if (!supportsSpeechRecognition || !phraseReady) return;
  if (isAnyPhrasePlaying) return;

  // ...rest unchanged
```

Finally, update both buttons' `disabled` conditions:

```tsx
<Button
  onClick={() => onPlay(phrase)}
  disabled={!phraseReady || isAnyPhraseRecording}
>
  {isPlaying ? "Tocando..." : "Play"}
</Button>
<Button
  variant={isRecording ? "destructive" : "secondary"}
  onClick={toggleRecording}
  disabled={
    !phraseReady ||
    !supportsSpeechRecognition ||
    isAnotherPhraseRecording ||
    isAnyPhrasePlaying
  }
>
  {isRecording ? "Parar gravação" : "Gravar / Repetir"}
</Button>
```

Note: `isRecording` (this card's own recording state, already stopping)
should still let the user press "Parar gravação" to stop even if
`isAnyPhraseRecording` is true for *this* card — check that the `disabled`
condition above does not accidentally block stopping an in-progress
recording on the card that owns it. Reasoning through it: when this card
is the one recording, `isAnotherPhraseRecording` is `false` for it (per its
existing definition in the parent) and `isAnyPhrasePlaying` is `false`
(recording and playing are now mutually exclusive by this same plan), so
the button stays enabled and `toggleRecording` correctly calls
`recognitionRef.current?.stop()`. Confirm this reasoning holds by testing
Step 5 below rather than trusting the written explanation alone.

**Verify**: `npm run typecheck` → exit 0.

### Step 4: Static verification

```bash
npm run typecheck
npm run lint
npm run build
```

**Verify**: all three exit 0.

### Step 5: Manual verification in the running app

```bash
npm run dev
```

Open http://localhost:3000. On any phrase card:
1. Click "Gravar / Repetir" to start a recording (grant mic permission if
   prompted). While `isRecording` is true (button shows "Parar gravação"),
   confirm the **same card's Play button is now disabled**.
2. Confirm **every other card's Play button is also disabled** while
   recording is active.
3. Click "Parar gravação" to stop — confirm it successfully stops (button
   returns to "Gravar / Repetir") and Play buttons re-enable across all
   cards.
4. Click "Play" on any card. While it's playing (button shows
   "Tocando..."), confirm the **Gravar/Repetir button on every card is
   disabled**, including the one currently playing.
5. Let playback finish (or wait for `onended`) — confirm Gravar/Repetir
   buttons re-enable.

Stop the dev server afterward (`Ctrl+C`).

## Test plan

This repo has no component-level test infrastructure yet (jsdom is
installed but no `vitest.config.ts`/environment docblock sets it up — see
`plans/002-test-text-similarity.md`'s maintenance note). Writing a full
React Testing Library test for this interaction is out of scope for this
plan; Step 5's manual verification is the acceptance test. If component
testing infrastructure exists by the time you execute this plan (check for
a `vitest.config.ts` with `environment: "jsdom"` or per-file
`@vitest-environment jsdom` docblocks), you may add
`src/components/PhraseCard/index.test.tsx` covering: Play disabled when
`isAnyPhraseRecording` is true; Gravar/Repetir disabled when
`isAnyPhrasePlaying` is true; both stay independently enabled when neither
is true. Treat this as a nice-to-have, not a done-criterion, since the
infrastructure it needs doesn't exist yet.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0
- [ ] Manual verification (Step 5, all 5 sub-checks) confirmed and reported
- [ ] Only `src/components/ListeningSpeakingApp/index.tsx` and
      `src/components/PhraseCard/index.tsx` are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at either file doesn't match the "Current state" excerpts above.
- After Step 3, the recording card's own "Parar gravação" button becomes
  unexpectedly disabled while it's the one recording (this would be a
  regression — that button must always remain clickable to let the user
  stop their own in-progress recording).
- `npm run dev` fails to start, or the browser shows console errors not
  present before this change.

## Maintenance notes

- If a future change adds a *third* concurrent "microphone-adjacent"
  activity (e.g. text-to-speech feedback, a pronunciation-comparison audio
  overlay), it must be folded into the same `isAnyPhrasePlaying` /
  `isAnyPhraseRecording` mutual-exclusion pattern established here, not a
  new one-off guard.
- A reviewer should scrutinize: that the `disabled` logic change doesn't
  accidentally disable buttons on *unrelated* cards when nothing is
  playing/recording (regression check: with the app freshly loaded, no
  buttons should be disabled except by the pre-existing `!phraseReady` /
  `!supportsSpeechRecognition` conditions).
