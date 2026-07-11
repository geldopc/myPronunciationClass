# myPronunciationClass — UX & Difficulty Overhaul (Sub-project A)

**Date:** 2026-07-11
**Status:** Approved design, ready for implementation planning
**Scope:** Frontend-only overhaul of the existing single-page practice app. No backend, no persistence.

---

## 1. Overview

The app helps a learner practice English listening + speaking by repeating lines
from a continuous Friends dialogue (36 phrases), scoring their speech against the
original via the Web Speech API. Today it renders a 2-column grid of always-open
cards — a static "poster", not an interactive trainer.

This overhaul turns it into a continuous, guided, interactive experience: a
single-column **script list** with a **continuity spine**, difficulty modes that
gate how much is revealed before the learner attempts a line, richer
icon-driven cards, live recording/playback feedback, and a minimalist
"Google-app" identity under the new name **myPronunciationClass**.

### Goals
- Replace the grid with a single continuous list that reads as one conversation ("continuidade").
- Add Easy / Moderate / Hard modes that control what a card reveals before an attempt.
- Redesign the card around icons and clear per-mode primary actions.
- Make it feel alive: live recording state, playback state, animated score reveal.
- Rebrand to myPronunciationClass with a minimal, Google-calm look.

### Non-goals (explicitly out of scope for A)
- Accounts / social login — see the separate plan `2026-07-11-accounts-progress-sharing-plan.md` (Sub-project B).
- Persisting progress across reloads. **A is stateless**: all progress (spine node
  states, `n/36` counter, this-run scores) is ephemeral React state, lost on refresh.
- Changing phrase text / audio / hints content.

---

## 2. Design decisions (locked with the user)

1. **Layout:** single-column continuous "script" list is the home base, **plus an
   optional focus mode** (one phrase at a time).
2. **Difficulty:** global session setting Easy / Moderate / Hard (not per-card).
   - Easy → text + hint both shown.
   - Moderate → text shown, pronunciation hint hidden (tap to peek), hint auto-reveals after attempt.
   - Hard → audio only; text + hint hidden, both reveal after the learner records (self-check).
3. **Rename:** full rename — folder → `myPronunciationClass`, package name →
   `my-pronunciation-class`, plus branding (title, header wordmark, README, favicon/logo).
   Done via `git mv` so history is preserved.
4. **State:** stateless (no localStorage). Progress is in-session only.
5. **Color:** monochrome per CLAUDE.md, with **one deliberate exception** — a single
   semantic green used *only* for the ≥80% success signal. Documented as an
   intentional carve-out from "do not change the colors in index.css".
6. **Theme switch:** light/dark toggle in the top bar. The `.dark` design tokens already
   exist in `styles.css`; this only adds the provider + toggle to actually drive them.
   Theme preference **persists** (localStorage) and defaults to the OS
   `prefers-color-scheme`. This is a display setting, orthogonal to the deliberately
   unpersisted practice progress (§ Non-goals). The green ≥80% accent must be verified
   legible in both themes.

---

## 3. Visual & interaction direction

- **Top app bar (sticky):** `myPronunciationClass` wordmark + icon; global audio-speed
  control (0.5–1.5x); Easy/Moderate/Hard segmented control; light/dark theme toggle
  (`Sun`/`Moon` icon).
- **Progress row (sticky under the bar):** thin progress bar + `n / 36` counter.
  Reflects ephemeral session progress (how many phrases attempted).
- **Continuity spine:** a vertical hairline down the left of the list, with a node per
  phrase. Node states: hollow = untouched, ring = current/active, filled = attempted.
  This is the literal expression of "continuidade" — the scene reads top-to-bottom as
  one conversation.
- **Speaker identity:** each phrase shows a small speaker chip (initial + name, e.g.
  "Joey · 07"), reinforcing that this is a multi-person dialogue.
- **Buttons:** icon + label using `lucide-react` (already installed — note: CLAUDE.md
  still says Phosphor, which is stale; the dependency is `lucide-react`). Play →
  `Play`/`Volume2`, Record → `Mic`, Stop → `Square`/`StopCircle`, peek → `Eye`, done → `Check`.
- **Focus mode:** a toggle that switches from the full list to a single large centered
  card with Prev/Next through the scene; auto-scrolls/advances. Same card component,
  different container.

A rendered mockup of this direction was reviewed and approved during brainstorming
(monochrome chrome, spine, three difficulty card states, live recording state).

---

## 4. Component architecture

Follows the project's CLAUDE.md conventions: one folder per component under
`src/components/`, `index.tsx` only, `export function` (no default), `id` on each
component, `@/` imports, shadcn where available, no arbitrary Tailwind values.

```
src/components/
  ListeningSpeakingApp/    (app shell; owns global state: playbackRate, difficulty,
                            focusMode, current phrase, ephemeral per-phrase attempt map,
                            recording/playing ids)
  TopBar/                  wordmark + SpeedControl + DifficultyToggle + ThemeToggle
    DifficultyToggle/      Easy/Moderate/Hard segmented control (shadcn ToggleGroup/Tabs)
    SpeedControl/          the existing playback-rate Select, extracted
    ThemeToggle/           Sun/Moon button; calls useTheme() from providers/Theme
  ProgressBar/             thin bar + "n / 36" (reads ephemeral session progress)
  PhraseList/              owns the continuity spine + maps phrases; hosts focus mode
    SpineNode/             single spine dot with untouched/current/done state
  PhraseCard/              refactored: speaker chip, difficulty-aware reveal,
                            icon+label actions, animated recording + score states
    ScoreReveal/           animated count-up % + transcript + green >=80 treatment

src/providers/
  Theme/                   ThemeProvider + useTheme(); reads/writes localStorage,
                            toggles `.dark` on <html>, defaults to prefers-color-scheme.
                            Wraps the app in __root.tsx, plus a tiny pre-hydration inline
                            script in __root.tsx to set the class before paint (no SSR flash).

src/hooks/
  useSpeechRecognition/    encapsulates webkitSpeechRecognition lifecycle
  useAudioPlayer/          encapsulates HTMLAudioElement + playbackRate + playing state

src/lib/
  phrases.ts               Phrase type gains `speaker: string`
  difficulty.ts            Difficulty type + reveal rules (what shows per mode/phase)
  text-similarity.ts       unchanged
```

**Why the extra units:** the current `PhraseCard` (213 lines) does audio, recognition,
scoring, error handling, and rendering. Splitting recognition/audio into hooks and
score display into `ScoreReveal` keeps each unit understandable and testable in isolation.

---

## 5. Data model

```ts
export type Phrase = {
  id: number
  text: string
  audioSrc: string
  pronunciationHint: string
  speaker: string   // NEW — e.g. "Joey", "Chandler", "Monica", "Rachel", "Ross"
}
```

`speaker` is added per phrase (derived from the script; some multi-speaker lines pick the
dominant/first speaker). Difficulty is **not** stored on the phrase — it's global UI state.

Ephemeral session state (in the app shell, not persisted):
```ts
type Attempt = { transcript: string; score: number }
attempts: Record<number, Attempt>       // phraseId -> best/last attempt this session
difficulty: "easy" | "moderate" | "hard"
focusMode: boolean
```

---

## 6. Difficulty reveal rules

| Element            | Easy (pre) | Moderate (pre) | Hard (pre) | Any mode (post-attempt) |
|--------------------|:----------:|:--------------:|:----------:|:-----------------------:|
| Phrase text        | shown      | shown          | hidden     | shown                   |
| Pronunciation hint | shown      | hidden (peek)  | hidden     | shown                   |
| Audio (Ouvir)      | shown      | shown          | shown      | shown                   |
| Record (Repetir)   | shown      | shown          | shown      | shown                   |
| Score + transcript | —          | —              | —          | shown                   |

"Peek" = a tap/click reveals the hidden hint on demand without recording.
"post-attempt" reveal is permanent for that phrase for the rest of the session.

---

## 7. Interactivity (from the design-critique pass)

- **Recording:** pulsing mic + live timer ("Ouvindo… 0:03") + a small animated level/waveform.
- **Playback:** active playing state with an animated indicator (not just "Tocando…").
- **Score reveal:** count-up animation to the % ; ≥80% gets the green treatment +
  `Check`; 50–79% neutral; <50% destructive tone. Transcript shown under the score.
- **Spine feedback:** node fills in when a phrase is attempted; current phrase node is ringed.
- **Keyboard shortcuts:** Space = play current, R = record current, ←/→ = prev/next in focus mode.
- **Focus mode:** auto-scroll/advance through the scene; large single card.
- All state changes that matter to assistive tech use `aria-live` (recording start/stop, score).

Concurrency guards from the current app are preserved: no play while recording, no
recording while audio plays, recording state always resets after an error/end.

---

## 8. Accessibility

- Maintain ≥4.5:1 contrast; verify muted hint text on the muted surface.
- Touch targets ≥44px on mobile; the single-column list already helps mobile density.
- `aria-live="polite"` region announces recording state and score results.
- Difficulty toggle and speed control are proper labelled form controls.
- Icon-only affordances get `aria-label`; decorative icons `aria-hidden`.

---

## 9. Rename mechanics

1. `git mv` the repo folder `treino_friends` → `myPronunciationClass` (contents/history intact).
2. `package.json` name → `my-pronunciation-class`.
3. Branding: `__root.tsx` `<title>`, the app header wordmark, `README.md`, favicon/logo (`logo.svg`).
4. Update any hardcoded "Friends"/"treino" copy in the header to the new identity while
   keeping the Friends scene as the practice content.
5. Verify dev server, tests, and TanStack route generation still run post-move.

---

## 10. Testing

- Keep/extend `text-similarity.test.ts`.
- Unit-test `difficulty.ts` reveal rules (each mode × phase → expected visibility).
- Component tests (Testing Library, already set up): card renders correct elements per
  difficulty; recording toggle flips state; score reveal shows green at ≥80.
- Manual/browser verification of the running app at desktop + mobile (Playwright MCP available).

---

## 11. Open items
- None blocking. The green ≥80% accent is an approved, documented exception to CLAUDE.md;
  the spec/PR should call it out so the rule and the code don't silently diverge.
