# myPronunciationClass — UX & Difficulty Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 2-column static practice grid into a single continuous, difficulty-gated, icon-driven, themeable "script" trainer rebranded as myPronunciationClass.

**Architecture:** Stateless React SPA on TanStack Start. A shell component (`ListeningSpeakingApp`) owns all ephemeral session state and composes a sticky `TopBar` (wordmark + difficulty + speed + theme + focus toggles), a sticky `ProgressBar`, and a `PhraseList` that threads phrases on a vertical "continuity spine". Audio and speech-recognition logic move into reusable hooks; difficulty reveal rules and theme live in pure modules/providers. No persistence except the display-only theme preference.

**Tech Stack:** React 19, TanStack Start/Router, TypeScript, Tailwind v4, shadcn/ui (`Button`, `Card`, `Select`), `lucide-react` icons, Vitest + Testing Library (jsdom).

## Global Constraints

Copied verbatim from `docs/superpowers/specs/2026-07-11-mypronunciationclass-ux-overhaul-design.md` and CLAUDE.md. Every task's requirements implicitly include these:

- Components: one folder per component under `src/components/`, `index.tsx` only, `export function` (NEVER `export default`, NEVER arrow-function components), an `id` attribute on each component's root element, sub-components do not repeat the parent prefix.
- Imports: always the `@/` alias, never relative paths.
- Styling: no arbitrary Tailwind values (e.g. `w-[123px]`); computed sizes go in inline `style` instead. Do NOT edit the color tokens in `src/styles.css`.
- Color: monochrome only, with EXACTLY ONE exception — Tailwind's built-in `green-600` (light) / `green-500` (dark) for the ≥80% success signal. No other colors added.
- Icons: import from `lucide-react`, use the `Icon`-suffixed exports (e.g. `PlayIcon`).
- No commented-out code; comments only for extreme complexity.
- App is STATELESS: practice progress (spine states, `n/36`, scores) is ephemeral React state, lost on refresh. The ONLY persisted value is the theme preference in `localStorage` under key `mpc-theme`.
- UI copy is Portuguese (pt-BR), matching the existing app.
- Rename target: folder `myPronunciationClass`, package name `my-pronunciation-class`, brand wordmark `myPronunciationClass`.

---

## File Structure

**Create:**
- `src/lib/difficulty.ts` — `Difficulty` type + `getRevealState()` pure reveal rules
- `src/lib/difficulty.test.ts`
- `src/lib/phrases.test.ts` — data-integrity test for the new `speaker` field
- `src/providers/Theme/index.tsx` — `ThemeProvider` + `useTheme()`
- `src/providers/Theme/index.test.tsx`
- `src/hooks/useAudioPlayer/index.ts`
- `src/hooks/useSpeechRecognition/index.ts` — owns `SpeechEvaluation` type
- `src/components/TopBar/index.tsx`
- `src/components/TopBar/DifficultyToggle/index.tsx`
- `src/components/TopBar/DifficultyToggle/index.test.tsx`
- `src/components/TopBar/SpeedControl/index.tsx` — owns `playbackRates` / `PlaybackRate`
- `src/components/TopBar/ThemeToggle/index.tsx`
- `src/components/ProgressBar/index.tsx`
- `src/components/PhraseList/index.tsx`
- `src/components/PhraseList/SpineNode/index.tsx`
- `src/components/PhraseCard/ScoreReveal/index.tsx`
- `src/components/PhraseCard/index.test.tsx`

**Modify:**
- `src/lib/phrases.ts` — add `speaker: string` to type + all 36 entries
- `src/components/PhraseCard/index.tsx` — full refactor (difficulty-aware reveal, icon buttons, hooks, ScoreReveal)
- `src/components/ListeningSpeakingApp/index.tsx` — full refactor (orchestration)
- `src/routes/__root.tsx` — no-flash theme script, `ThemeProvider` wrap, `<title>`
- `package.json` — `name`
- `public/manifest.json`, `src/logo.svg`, `README.md` — branding
- Repo root folder `treino_friends` → `myPronunciationClass` (Task 13, last)

---

## Task 1: Git prep & feature branch

**Files:** none (git only).

- [ ] **Step 1: Commit the pre-existing Prettier drift as a style commit**

```bash
cd /Users/geldopc/Documents/nerdzilla/treino_friends
git add src/components/ListeningSpeakingApp/index.tsx src/lib/phrases.ts src/lib/text-similarity.test.ts
git commit -m "style: apply prettier formatting"
```

- [ ] **Step 2: Create and switch to the feature branch**

```bash
git checkout -b feat/mypronunciationclass-overhaul
```

- [ ] **Step 3: Commit the design docs on the branch**

```bash
git add docs/superpowers/specs docs/superpowers/plans .claude/launch.json
git commit -m "docs: add myPronunciationClass overhaul spec, accounts plan, and implementation plan"
```

Expected: `git status` clean; `git branch --show-current` prints `feat/mypronunciationclass-overhaul`.

---

## Task 2: Difficulty reveal rules (`src/lib/difficulty.ts`)

**Files:**
- Create: `src/lib/difficulty.ts`
- Test: `src/lib/difficulty.test.ts`

**Interfaces:**
- Produces: `type Difficulty = "easy" | "moderate" | "hard"`; `type RevealState = { showText: boolean; showHint: boolean; canPeekHint: boolean }`; `function getRevealState(difficulty: Difficulty, attempted: boolean): RevealState`.

- [ ] **Step 1: Write the failing test**

`src/lib/difficulty.test.ts`:
```ts
import { describe, expect, it } from "vitest"

import { getRevealState } from "@/lib/difficulty"

describe("getRevealState", () => {
  it("easy pre-attempt shows text and hint", () => {
    expect(getRevealState("easy", false)).toEqual({
      showText: true,
      showHint: true,
      canPeekHint: false,
    })
  })

  it("moderate pre-attempt shows text, hides hint, allows peek", () => {
    expect(getRevealState("moderate", false)).toEqual({
      showText: true,
      showHint: false,
      canPeekHint: true,
    })
  })

  it("hard pre-attempt hides text and hint with no peek", () => {
    expect(getRevealState("hard", false)).toEqual({
      showText: false,
      showHint: false,
      canPeekHint: false,
    })
  })

  it("any mode post-attempt reveals text and hint", () => {
    for (const difficulty of ["easy", "moderate", "hard"] as const) {
      expect(getRevealState(difficulty, true)).toEqual({
        showText: true,
        showHint: true,
        canPeekHint: false,
      })
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- difficulty` → FAIL (module not found).

- [ ] **Step 3: Implement**

`src/lib/difficulty.ts`:
```ts
export type Difficulty = "easy" | "moderate" | "hard"

export type RevealState = {
  showText: boolean
  showHint: boolean
  canPeekHint: boolean
}

export function getRevealState(
  difficulty: Difficulty,
  attempted: boolean
): RevealState {
  if (attempted) {
    return { showText: true, showHint: true, canPeekHint: false }
  }

  switch (difficulty) {
    case "easy":
      return { showText: true, showHint: true, canPeekHint: false }
    case "moderate":
      return { showText: true, showHint: false, canPeekHint: true }
    case "hard":
      return { showText: false, showHint: false, canPeekHint: false }
  }
}
```

- [ ] **Step 4: Run to verify it passes** — `npm test -- difficulty` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/difficulty.ts src/lib/difficulty.test.ts
git commit -m "feat: add difficulty reveal rules"
```

---

## Task 3: Add `speaker` to phrases (`src/lib/phrases.ts`)

**Files:**
- Modify: `src/lib/phrases.ts:1-6` (type) and every entry in the `phrases` array
- Test: `src/lib/phrases.test.ts`

**Interfaces:**
- Produces: `Phrase` gains `speaker: string`.

Speaker attribution is **display-only best-effort** from the scene; any label can be corrected later without code changes. Mapping by phrase `id`:

```
1 Chandler · 2 Rachel · 3 Rachel · 4 Chandler · 5 Rachel · 6 Chandler
7 Ross · 8 Rachel · 9 Monica · 10 Rachel · 11 Rachel · 12 Rachel
13 Chandler · 14 Rachel · 15 Ross · 16 Ross · 17 Ross · 18 Chandler
19 Rachel · 20 Monica · 21 Chandler · 22 Joey · 23 Monica · 24 Chandler
25 Joey · 26 Monica · 27 Joey · 28 Chandler · 29 Monica · 30 Joey
31 Joey · 32 Monica · 33 Joey · 34 Monica · 35 Rachel · 36 Joey
```

- [ ] **Step 1: Write the failing test**

`src/lib/phrases.test.ts`:
```ts
import { describe, expect, it } from "vitest"

import { phrases } from "@/lib/phrases"

describe("phrases data", () => {
  it("has 36 phrases", () => {
    expect(phrases).toHaveLength(36)
  })

  it("every phrase has a non-empty speaker", () => {
    for (const phrase of phrases) {
      expect(phrase.speaker.trim().length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- phrases` → FAIL (`speaker` undefined / type error).

- [ ] **Step 3: Implement**

Edit the type at `src/lib/phrases.ts`:
```ts
export type Phrase = {
  id: number
  text: string
  audioSrc: string
  pronunciationHint: string
  speaker: string
}
```

Then add a `speaker` field to each of the 36 objects using the mapping above (e.g. entry `id: 1` gets `speaker: "Chandler",`, `id: 2` gets `speaker: "Rachel",`, … `id: 36` gets `speaker: "Joey",`). Place `speaker` immediately after each object's `id` line for readability.

- [ ] **Step 4: Run to verify it passes** — `npm test -- phrases` → PASS. Also run `npm run typecheck` → no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/phrases.ts src/lib/phrases.test.ts
git commit -m "feat: add speaker attribution to phrases"
```

---

## Task 4: Theme provider, no-flash script & `<title>` (`src/providers/Theme`, `src/routes/__root.tsx`)

**Files:**
- Create: `src/providers/Theme/index.tsx`
- Test: `src/providers/Theme/index.test.tsx`
- Modify: `src/routes/__root.tsx`

**Interfaces:**
- Produces: `function ThemeProvider({ children }: { children: React.ReactNode })`; `function useTheme(): { theme: "light" | "dark"; toggleTheme: () => void }`. Reads/writes `localStorage["mpc-theme"]`, toggles `.dark` on `<html>`.

- [ ] **Step 1: Write the failing test**

`src/providers/Theme/index.test.tsx`:
```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ThemeProvider, useTheme } from "@/providers/Theme"

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

afterEach(() => {
  document.documentElement.classList.remove("dark")
  window.localStorage.clear()
})

describe("ThemeProvider", () => {
  it("toggles the theme and the html class", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    const button = screen.getByRole("button")
    expect(button.textContent).toBe("light")

    fireEvent.click(button)
    expect(button.textContent).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(window.localStorage.getItem("mpc-theme")).toBe("dark")
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- Theme` → FAIL (module not found).

- [ ] **Step 3: Implement the provider**

`src/providers/Theme/index.tsx`:
```tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
}

const STORAGE_KEY = "mpc-theme"

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light"
  return document.documentElement.classList.contains("dark") ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
```

- [ ] **Step 4: Run to verify it passes** — `npm test -- Theme` → PASS.

- [ ] **Step 5: Wire the no-flash script, provider, and title into `__root.tsx`**

In `src/routes/__root.tsx`: change the `title` meta to `myPronunciationClass`; import `ThemeProvider`; add the pre-hydration script and wrap `{children}`.

Change the title object:
```tsx
      {
        title: "myPronunciationClass",
      },
```

Add the import:
```tsx
import { ThemeProvider } from "@/providers/Theme"
```

Replace the `RootDocument` body so the script runs in `<head>` before paint and the app is wrapped:
```tsx
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mpc-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Verify build & types** — `npm run typecheck` → no errors. `npm test` → all green.

- [ ] **Step 7: Commit**

```bash
git add src/providers/Theme src/routes/__root.tsx
git commit -m "feat: add theme provider with no-flash SSR script"
```

---

## Task 5: Audio player hook (`src/hooks/useAudioPlayer`)

**Files:**
- Create: `src/hooks/useAudioPlayer/index.ts`

**Interfaces:**
- Consumes: none.
- Produces: `function useAudioPlayer(playbackRate: number): { playingId: number | null; play: (id: number, src: string) => Promise<void>; stop: () => void }`.

This extracts the audio logic currently inline in `ListeningSpeakingApp` (`src/components/ListeningSpeakingApp/index.tsx:18-67`), preserving behavior: pause any current audio before playing a new one, clear `playingId` on end/error, apply `playbackRate` live.

- [ ] **Step 1: Implement**

`src/hooks/useAudioPlayer/index.ts`:
```ts
import { useEffect, useRef, useState } from "react"

export function useAudioPlayer(playbackRate: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  async function play(id: number, src: string) {
    audioRef.current?.pause()

    const audio = new Audio(src)
    audioRef.current = audio
    audio.playbackRate = playbackRate
    audio.onended = () => setPlayingId(null)
    audio.onerror = () => setPlayingId(null)

    try {
      setPlayingId(id)
      await audio.play()
    } catch {
      setPlayingId(null)
    }
  }

  function stop() {
    audioRef.current?.pause()
    setPlayingId(null)
  }

  return { playingId, play, stop }
}
```

- [ ] **Step 2: Verify types** — `npm run typecheck` → no errors (hook is unused until Task 11; that's fine).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useAudioPlayer
git commit -m "feat: add useAudioPlayer hook"
```

---

## Task 6: Speech-recognition hook (`src/hooks/useSpeechRecognition`)

**Files:**
- Create: `src/hooks/useSpeechRecognition/index.ts`

**Interfaces:**
- Consumes: `getSimilarityPercentage` from `@/lib/text-similarity`.
- Produces: `type SpeechEvaluation = { transcript: string; score: number }`; `function useSpeechRecognition(options: { supported: boolean; onEvaluation: (evaluation: SpeechEvaluation) => void; onRecordingChange: (recording: boolean) => void }): { isRecording: boolean; error: string | null; start: (targetText: string) => void; stop: () => void }`.

This extracts the recognition logic currently inline in `PhraseCard` (`src/components/PhraseCard/index.tsx:54-131`), preserving all error handling and the double-set concurrency guard.

- [ ] **Step 1: Implement**

`src/hooks/useSpeechRecognition/index.ts`:
```ts
import { useEffect, useRef, useState } from "react"

import { getSimilarityPercentage } from "@/lib/text-similarity"

export type SpeechEvaluation = {
  transcript: string
  score: number
}

const recognitionErrorMessages: Record<string, string> = {
  "audio-capture": "Nenhum microfone foi encontrado.",
  "not-allowed": "Permita o uso do microfone no navegador.",
  "service-not-allowed": "O serviço de reconhecimento não está disponível.",
  network: "Não foi possível acessar o serviço de reconhecimento.",
  "no-speech": "Não foi detectada fala. Tente novamente.",
}

type UseSpeechRecognitionOptions = {
  supported: boolean
  onEvaluation: (evaluation: SpeechEvaluation) => void
  onRecordingChange: (recording: boolean) => void
}

export function useSpeechRecognition({
  supported,
  onEvaluation,
  onRecordingChange,
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  function finish() {
    setIsRecording(false)
    onRecordingChange(false)
  }

  function start(targetText: string) {
    if (!supported) return

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionApi) return

    setError(null)
    const recognition = new SpeechRecognitionApi()
    recognitionRef.current = recognition
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      onRecordingChange(true)
    }

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      const transcript = lastResult[0].transcript.trim()

      onEvaluation({
        transcript,
        score: getSimilarityPercentage(targetText, transcript),
      })
    }

    recognition.onerror = (event) => {
      setError(
        recognitionErrorMessages[event.error] ??
          "Não foi possível reconhecer a fala."
      )
      finish()
    }

    recognition.onend = finish

    try {
      setIsRecording(true)
      onRecordingChange(true)
      recognition.start()
    } catch {
      setError("A gravação já está sendo iniciada. Tente novamente.")
      finish()
    }
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  return { isRecording, error, start, stop }
}
```

- [ ] **Step 2: Verify types** — `npm run typecheck` → no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSpeechRecognition
git commit -m "feat: add useSpeechRecognition hook"
```

---

## Task 7: Score reveal (`src/components/PhraseCard/ScoreReveal`)

**Files:**
- Create: `src/components/PhraseCard/ScoreReveal/index.tsx`

**Interfaces:**
- Consumes: `SpeechEvaluation` from `@/hooks/useSpeechRecognition`.
- Produces: `function ScoreReveal({ evaluation }: { evaluation: SpeechEvaluation })`.

The count-up animation is verified in-browser (Task 11); the green-threshold branch is covered by `PhraseCard`'s test in Task 8. This is the single sanctioned color exception (`text-green-600 dark:text-green-500`).

- [ ] **Step 1: Implement**

`src/components/PhraseCard/ScoreReveal/index.tsx`:
```tsx
import { useEffect, useState } from "react"
import { CheckIcon } from "lucide-react"

import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"

const GREEN_THRESHOLD = 80
const NEUTRAL_THRESHOLD = 50
const COUNT_UP_MS = 600

function toneClass(score: number): string {
  if (score >= GREEN_THRESHOLD) return "text-green-600 dark:text-green-500"
  if (score >= NEUTRAL_THRESHOLD) return "text-foreground"
  return "text-destructive"
}

export function ScoreReveal({ evaluation }: { evaluation: SpeechEvaluation }) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let frame = 0
    let startTime: number | null = null

    function tick(now: number) {
      if (startTime === null) startTime = now
      const progress = Math.min((now - startTime) / COUNT_UP_MS, 1)
      setDisplayScore(Math.round(progress * evaluation.score))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [evaluation.score])

  const isSuccess = evaluation.score >= GREEN_THRESHOLD

  return (
    <div
      id="score-reveal"
      aria-live="polite"
      className="space-y-1 rounded-md border border-border p-3 text-sm"
    >
      <p className="text-muted-foreground">Você disse</p>
      <p className="font-medium">&ldquo;{evaluation.transcript}&rdquo;</p>
      <p
        className={`flex items-center gap-1 font-semibold ${toneClass(evaluation.score)}`}
      >
        {isSuccess && <CheckIcon />}
        Acerto: {displayScore}%
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify types** — `npm run typecheck` → no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/PhraseCard/ScoreReveal
git commit -m "feat: add animated ScoreReveal with green success signal"
```

---

## Task 8: PhraseCard refactor (`src/components/PhraseCard/index.tsx`)

**Files:**
- Modify (full rewrite): `src/components/PhraseCard/index.tsx`
- Test: `src/components/PhraseCard/index.test.tsx`

**Interfaces:**
- Consumes: `useSpeechRecognition` + `SpeechEvaluation` (`@/hooks/useSpeechRecognition`), `getRevealState` + `Difficulty` (`@/lib/difficulty`), `ScoreReveal` (`@/components/PhraseCard/ScoreReveal`), `isPhraseReady` + `Phrase` (`@/lib/phrases`).
- Produces: `function PhraseCard(props: PhraseCardProps)` where
```ts
type PhraseCardProps = {
  phrase: Phrase
  difficulty: Difficulty
  isPlaying: boolean
  isAnyPhrasePlaying: boolean
  isAnyPhraseRecording: boolean
  isAnotherPhraseRecording: boolean
  supportsSpeechRecognition: boolean
  evaluation?: SpeechEvaluation
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
  registerToggle: (phraseId: number, toggle: (() => void) | null) => void
}
```
- NOTE: `SpeechEvaluation` is no longer exported from this file — importers must use `@/hooks/useSpeechRecognition`.

- [ ] **Step 1: Write the failing test**

`src/components/PhraseCard/index.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { PhraseCard } from "@/components/PhraseCard"
import type { Phrase } from "@/lib/phrases"

const phrase: Phrase = {
  id: 1,
  text: "Hello there friend",
  audioSrc: "/audios/frase1.mp3",
  pronunciationHint: "Say it clearly",
  speaker: "Joey",
}

const baseProps = {
  phrase,
  isPlaying: false,
  isAnyPhrasePlaying: false,
  isAnyPhraseRecording: false,
  isAnotherPhraseRecording: false,
  supportsSpeechRecognition: true,
  onPlay: () => {},
  onRecordingChange: () => {},
  onEvaluation: () => {},
  registerToggle: () => {},
}

describe("PhraseCard reveal by difficulty", () => {
  it("easy shows text and hint", () => {
    render(<PhraseCard {...baseProps} difficulty="easy" />)
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
  })

  it("moderate shows text, hides hint behind a peek button", () => {
    render(<PhraseCard {...baseProps} difficulty="moderate" />)
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
    expect(screen.queryByText("Ver dica")).not.toBeNull()
  })

  it("hard hides text and hint pre-attempt", () => {
    render(<PhraseCard {...baseProps} difficulty="hard" />)
    expect(screen.queryByText("Hello there friend")).toBeNull()
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
  })

  it("shows text, hint and score once attempted, even in hard", () => {
    render(
      <PhraseCard
        {...baseProps}
        difficulty="hard"
        evaluation={{ transcript: "hello there friend", score: 91 }}
      />
    )
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
    expect(screen.queryByText(/Acerto:/)).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- PhraseCard` → FAIL (props/types mismatch).

- [ ] **Step 3: Implement the full rewrite**

`src/components/PhraseCard/index.tsx`:
```tsx
import { useEffect, useState } from "react"
import {
  EyeIcon,
  MicIcon,
  PlayIcon,
  SquareIcon,
  Volume2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { ScoreReveal } from "@/components/PhraseCard/ScoreReveal"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import { getRevealState } from "@/lib/difficulty"
import type { Difficulty } from "@/lib/difficulty"
import { isPhraseReady } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"

type PhraseCardProps = {
  phrase: Phrase
  difficulty: Difficulty
  isPlaying: boolean
  isAnyPhrasePlaying: boolean
  isAnyPhraseRecording: boolean
  isAnotherPhraseRecording: boolean
  supportsSpeechRecognition: boolean
  evaluation?: SpeechEvaluation
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
  registerToggle: (phraseId: number, toggle: (() => void) | null) => void
}

export function PhraseCard({
  phrase,
  difficulty,
  isPlaying,
  isAnyPhrasePlaying,
  isAnyPhraseRecording,
  isAnotherPhraseRecording,
  supportsSpeechRecognition,
  evaluation,
  onPlay,
  onRecordingChange,
  onEvaluation,
  registerToggle,
}: PhraseCardProps) {
  const [peeked, setPeeked] = useState(false)
  const phraseReady = isPhraseReady(phrase)
  const attempted = Boolean(evaluation)
  const reveal = getRevealState(difficulty, attempted)

  const { isRecording, error, start, stop } = useSpeechRecognition({
    supported: supportsSpeechRecognition,
    onEvaluation: (result) => onEvaluation(phrase.id, result),
    onRecordingChange: (recording) =>
      onRecordingChange(recording ? phrase.id : null),
  })

  function toggleRecording() {
    if (isRecording) {
      stop()
      return
    }
    if (isAnyPhrasePlaying || !phraseReady || !supportsSpeechRecognition) return
    start(phrase.text)
  }

  useEffect(() => {
    registerToggle(phrase.id, toggleRecording)
    return () => registerToggle(phrase.id, null)
  })

  const showHint = reveal.showHint || (reveal.canPeekHint && peeked)

  return (
    <Card id={`phrase-card-${phrase.id}`}>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
            {phrase.speaker.charAt(0)}
          </span>
          <span className="font-medium text-foreground">{phrase.speaker}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {String(phrase.id).padStart(2, "0")}
          </span>
        </div>
        {reveal.showText ? (
          <p className="text-lg leading-relaxed">{phrase.text}</p>
        ) : (
          <p className="text-lg text-muted-foreground italic">
            Ouça e repita — o texto aparece depois da sua tentativa.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {showHint && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Dica de pronúncia:{" "}
            </span>
            {phrase.pronunciationHint}
          </div>
        )}

        {reveal.canPeekHint && !showHint && (
          <Button variant="ghost" size="sm" onClick={() => setPeeked(true)}>
            <EyeIcon /> Ver dica
          </Button>
        )}

        {evaluation && <ScoreReveal evaluation={evaluation} />}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {!supportsSpeechRecognition && (
          <p className="text-sm text-destructive">
            Seu navegador não oferece suporte ao reconhecimento de voz.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          onClick={() => onPlay(phrase)}
          disabled={!phraseReady || isAnyPhraseRecording}
        >
          {isPlaying ? (
            <>
              <Volume2Icon /> Tocando…
            </>
          ) : (
            <>
              <PlayIcon /> Ouvir
            </>
          )}
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
          {isRecording ? (
            <>
              <SquareIcon /> Parar
            </>
          ) : (
            <>
              <MicIcon /> Repetir
            </>
          )}
        </Button>
        {isRecording && (
          <span
            className="self-center text-sm font-medium text-destructive"
            aria-live="polite"
          >
            Ouvindo…
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
```

- [ ] **Step 4: Run to verify it passes** — `npm test -- PhraseCard` → PASS. `npm run typecheck` will still error in `ListeningSpeakingApp` (old props) until Task 11 — that's expected; the component test must pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/PhraseCard/index.tsx src/components/PhraseCard/index.test.tsx
git commit -m "feat: refactor PhraseCard with difficulty reveal and icon actions"
```

---

## Task 9: Continuity spine (`src/components/PhraseList/SpineNode`)

**Files:**
- Create: `src/components/PhraseList/SpineNode/index.tsx`

**Interfaces:**
- Produces: `type SpineNodeState = "untouched" | "current" | "done"`; `function SpineNode({ phraseId, state }: { phraseId: number; state: SpineNodeState })`.

- [ ] **Step 1: Implement**

`src/components/PhraseList/SpineNode/index.tsx`:
```tsx
export type SpineNodeState = "untouched" | "current" | "done"

const stateClass: Record<SpineNodeState, string> = {
  untouched: "border-border bg-background",
  current: "border-foreground bg-background ring-2 ring-ring/40",
  done: "border-foreground bg-foreground",
}

export function SpineNode({
  phraseId,
  state,
}: {
  phraseId: number
  state: SpineNodeState
}) {
  return (
    <span
      id={`spine-node-${phraseId}`}
      aria-hidden
      className={`size-3 shrink-0 rounded-full border-2 ${stateClass[state]}`}
    />
  )
}
```

- [ ] **Step 2: Verify types** — `npm run typecheck` (ignore the pre-existing `ListeningSpeakingApp` error until Task 11).

- [ ] **Step 3: Commit**

```bash
git add src/components/PhraseList/SpineNode
git commit -m "feat: add continuity spine node"
```

---

## Task 10: Phrase list + focus mode (`src/components/PhraseList`)

**Files:**
- Create: `src/components/PhraseList/index.tsx`

**Interfaces:**
- Consumes: `PhraseCard` (`@/components/PhraseCard`), `SpineNode` + `SpineNodeState` (`@/components/PhraseList/SpineNode`), `Phrase` (`@/lib/phrases`), `Difficulty` (`@/lib/difficulty`), `SpeechEvaluation` (`@/hooks/useSpeechRecognition`), `Button` (`@/components/ui/button`), `ChevronLeftIcon` / `ChevronRightIcon` (`lucide-react`).
- Produces: `function PhraseList(props: PhraseListProps)` where
```ts
type PhraseListProps = {
  phrases: Phrase[]
  difficulty: Difficulty
  focusMode: boolean
  currentPhraseId: number
  onCurrentPhraseChange: (phraseId: number) => void
  playingId: number | null
  recordingPhraseId: number | null
  supportsSpeechRecognition: boolean
  evaluations: Record<number, SpeechEvaluation>
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
  registerToggle: (phraseId: number, toggle: (() => void) | null) => void
}
```

- [ ] **Step 1: Implement**

`src/components/PhraseList/index.tsx`:
```tsx
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PhraseCard } from "@/components/PhraseCard"
import { SpineNode } from "@/components/PhraseList/SpineNode"
import type { SpineNodeState } from "@/components/PhraseList/SpineNode"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import type { Difficulty } from "@/lib/difficulty"
import type { Phrase } from "@/lib/phrases"

type PhraseListProps = {
  phrases: Phrase[]
  difficulty: Difficulty
  focusMode: boolean
  currentPhraseId: number
  onCurrentPhraseChange: (phraseId: number) => void
  playingId: number | null
  recordingPhraseId: number | null
  supportsSpeechRecognition: boolean
  evaluations: Record<number, SpeechEvaluation>
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
  registerToggle: (phraseId: number, toggle: (() => void) | null) => void
}

function getNodeState(
  phrase: Phrase,
  currentPhraseId: number,
  evaluations: Record<number, SpeechEvaluation>
): SpineNodeState {
  if (evaluations[phrase.id]) return "done"
  if (phrase.id === currentPhraseId) return "current"
  return "untouched"
}

export function PhraseList(props: PhraseListProps) {
  const {
    phrases,
    difficulty,
    focusMode,
    currentPhraseId,
    onCurrentPhraseChange,
    playingId,
    recordingPhraseId,
    supportsSpeechRecognition,
    evaluations,
    onPlay,
    onRecordingChange,
    onEvaluation,
    registerToggle,
  } = props

  function cardPropsFor(phrase: Phrase) {
    return {
      phrase,
      difficulty,
      isPlaying: playingId === phrase.id,
      isAnyPhrasePlaying: playingId !== null,
      isAnyPhraseRecording: recordingPhraseId !== null,
      isAnotherPhraseRecording:
        recordingPhraseId !== null && recordingPhraseId !== phrase.id,
      supportsSpeechRecognition,
      evaluation: evaluations[phrase.id],
      onPlay,
      onRecordingChange,
      onEvaluation,
      registerToggle,
    }
  }

  if (focusMode) {
    const index = Math.max(
      phrases.findIndex((phrase) => phrase.id === currentPhraseId),
      0
    )
    const phrase = phrases[index]

    return (
      <section
        id="phrase-list"
        aria-label="Frase atual"
        className="mx-auto max-w-xl space-y-4"
      >
        <PhraseCard {...cardPropsFor(phrase)} />
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={index <= 0}
            onClick={() => onCurrentPhraseChange(phrases[index - 1].id)}
          >
            <ChevronLeftIcon /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {index + 1} / {phrases.length}
          </span>
          <Button
            variant="ghost"
            disabled={index >= phrases.length - 1}
            onClick={() => onCurrentPhraseChange(phrases[index + 1].id)}
          >
            Próxima <ChevronRightIcon />
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      id="phrase-list"
      aria-label="Frases para praticar"
      className="space-y-4"
    >
      {phrases.map((phrase, index) => (
        <div key={phrase.id} className="flex gap-4">
          <div className="flex flex-col items-center pt-6">
            <SpineNode
              phraseId={phrase.id}
              state={getNodeState(phrase, currentPhraseId, evaluations)}
            />
            {index < phrases.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
            )}
          </div>
          <div className="flex-1 pb-2">
            <PhraseCard {...cardPropsFor(phrase)} />
          </div>
        </div>
      ))}
    </section>
  )
}
```

- [ ] **Step 2: Verify types** — `npm run typecheck` (ignore only the `ListeningSpeakingApp` error until Task 11).

- [ ] **Step 3: Commit**

```bash
git add src/components/PhraseList/index.tsx
git commit -m "feat: add phrase list with continuity spine and focus mode"
```

---

## Task 11: Top bar, controls, progress & orchestration

**Files:**
- Create: `src/components/TopBar/SpeedControl/index.tsx`
- Create: `src/components/TopBar/DifficultyToggle/index.tsx`
- Create: `src/components/TopBar/DifficultyToggle/index.test.tsx`
- Create: `src/components/TopBar/ThemeToggle/index.tsx`
- Create: `src/components/TopBar/index.tsx`
- Create: `src/components/ProgressBar/index.tsx`
- Modify (full rewrite): `src/components/ListeningSpeakingApp/index.tsx`

**Interfaces:**
- `SpeedControl` produces: `const playbackRates = [0.5, 0.75, 1, 1.25, 1.5] as const`; `type PlaybackRate = (typeof playbackRates)[number]`; `function SpeedControl({ value, onChange }: { value: PlaybackRate; onChange: (value: PlaybackRate) => void })`.
- `DifficultyToggle` produces: `function DifficultyToggle({ value, onChange }: { value: Difficulty; onChange: (value: Difficulty) => void })`.
- `ThemeToggle` produces: `function ThemeToggle()`.
- `TopBar` produces: `function TopBar(props)` with `{ difficulty, onDifficultyChange, playbackRate, onPlaybackRateChange, focusMode, onToggleFocusMode }`.
- `ProgressBar` produces: `function ProgressBar({ completed, total }: { completed: number; total: number })`.

- [ ] **Step 1: Write the failing DifficultyToggle test**

`src/components/TopBar/DifficultyToggle/index.test.tsx`:
```tsx
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { DifficultyToggle } from "@/components/TopBar/DifficultyToggle"

describe("DifficultyToggle", () => {
  it("marks the active option and emits changes", () => {
    const onChange = vi.fn()
    render(<DifficultyToggle value="easy" onChange={onChange} />)

    const easy = screen.getByRole("radio", { name: "Fácil" })
    expect(easy.getAttribute("aria-checked")).toBe("true")

    fireEvent.click(screen.getByRole("radio", { name: "Difícil" }))
    expect(onChange).toHaveBeenCalledWith("hard")
  })
})
```

- [ ] **Step 2: Run to verify it fails** — `npm test -- DifficultyToggle` → FAIL.

- [ ] **Step 3: Implement `SpeedControl`**

`src/components/TopBar/SpeedControl/index.tsx`:
```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const playbackRates = [0.5, 0.75, 1, 1.25, 1.5] as const
export type PlaybackRate = (typeof playbackRates)[number]

type SpeedControlProps = {
  value: PlaybackRate
  onChange: (value: PlaybackRate) => void
}

export function SpeedControl({ value, onChange }: SpeedControlProps) {
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onChange(Number(next) as PlaybackRate)}
    >
      <SelectTrigger id="speed-control" aria-label="Velocidade do áudio">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {playbackRates.map((rate) => (
          <SelectItem key={rate} value={String(rate)}>
            {rate.toFixed(rate % 1 === 0 ? 1 : 2)}x
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

- [ ] **Step 4: Implement `DifficultyToggle`** (button-based segmented control; shadcn `ToggleGroup` is not installed and the monochrome design is fully served by `Button` variants — documented deviation from "use shadcn when available")

`src/components/TopBar/DifficultyToggle/index.tsx`:
```tsx
import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/difficulty"

const options: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Fácil" },
  { value: "moderate", label: "Médio" },
  { value: "hard", label: "Difícil" },
]

type DifficultyToggleProps = {
  value: Difficulty
  onChange: (value: Difficulty) => void
}

export function DifficultyToggle({ value, onChange }: DifficultyToggleProps) {
  return (
    <div
      id="difficulty-toggle"
      role="radiogroup"
      aria-label="Nível de dificuldade"
      className="inline-flex gap-1 rounded-4xl border border-border p-1"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: Run to verify DifficultyToggle passes** — `npm test -- DifficultyToggle` → PASS.

- [ ] **Step 6: Implement `ThemeToggle`** (mount-gated icon to avoid SSR hydration mismatch)

`src/components/TopBar/ThemeToggle/index.tsx`:
```tsx
import { useEffect, useState } from "react"
import { MoonIcon, SunIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useTheme } from "@/providers/Theme"

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const isDark = mounted && theme === "dark"

  return (
    <Button
      id="theme-toggle"
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
      onClick={toggleTheme}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </Button>
  )
}
```

- [ ] **Step 7: Implement `TopBar`**

`src/components/TopBar/index.tsx`:
```tsx
import { ListIcon, Maximize2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DifficultyToggle } from "@/components/TopBar/DifficultyToggle"
import { SpeedControl } from "@/components/TopBar/SpeedControl"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { ThemeToggle } from "@/components/TopBar/ThemeToggle"
import type { Difficulty } from "@/lib/difficulty"

type TopBarProps = {
  difficulty: Difficulty
  onDifficultyChange: (value: Difficulty) => void
  playbackRate: PlaybackRate
  onPlaybackRateChange: (value: PlaybackRate) => void
  focusMode: boolean
  onToggleFocusMode: () => void
}

export function TopBar({
  difficulty,
  onDifficultyChange,
  playbackRate,
  onPlaybackRateChange,
  focusMode,
  onToggleFocusMode,
}: TopBarProps) {
  return (
    <header
      id="top-bar"
      className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="container mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <span className="text-base font-semibold tracking-tight">
          myPronunciationClass
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyToggle value={difficulty} onChange={onDifficultyChange} />
          <SpeedControl value={playbackRate} onChange={onPlaybackRateChange} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={focusMode ? "Ver lista completa" : "Modo foco"}
            aria-pressed={focusMode}
            onClick={onToggleFocusMode}
          >
            {focusMode ? <ListIcon /> : <Maximize2Icon />}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 8: Implement `ProgressBar`**

`src/components/ProgressBar/index.tsx`:
```tsx
type ProgressBarProps = {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div id="progress-bar" className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Progresso da prática"
        />
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {completed} / {total}
      </span>
    </div>
  )
}
```

- [ ] **Step 9: Rewrite `ListeningSpeakingApp` as the orchestrator** (wires hooks, difficulty, focus mode, progress, and Space / R / ←→ keyboard shortcuts via a toggle registry)

`src/components/ListeningSpeakingApp/index.tsx`:
```tsx
import { useCallback, useEffect, useRef, useState } from "react"

import { ProgressBar } from "@/components/ProgressBar"
import { PhraseList } from "@/components/PhraseList"
import { TopBar } from "@/components/TopBar"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import type { Difficulty } from "@/lib/difficulty"
import { phrases } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"

export function ListeningSpeakingApp() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [focusMode, setFocusMode] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1)
  const [currentPhraseId, setCurrentPhraseId] = useState<number>(phrases[0].id)
  const [recordingPhraseId, setRecordingPhraseId] = useState<number | null>(
    null
  )
  const [evaluations, setEvaluations] = useState<
    Record<number, SpeechEvaluation>
  >({})
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] =
    useState(false)

  const { playingId, play } = useAudioPlayer(playbackRate)
  const toggleRegistry = useRef(new Map<number, () => void>())

  useEffect(() => {
    setSupportsSpeechRecognition(
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
    )
  }, [])

  const registerToggle = useCallback(
    (phraseId: number, toggle: (() => void) | null) => {
      if (toggle) {
        toggleRegistry.current.set(phraseId, toggle)
      } else {
        toggleRegistry.current.delete(phraseId)
      }
    },
    []
  )

  function handlePlay(phrase: Phrase) {
    if (recordingPhraseId !== null) return
    setCurrentPhraseId(phrase.id)
    play(phrase.id, phrase.audioSrc)
  }

  function handleRecordingChange(phraseId: number | null) {
    setRecordingPhraseId(phraseId)
    if (phraseId !== null) setCurrentPhraseId(phraseId)
  }

  function saveEvaluation(phraseId: number, evaluation: SpeechEvaluation) {
    setEvaluations((current) => ({ ...current, [phraseId]: evaluation }))
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return
      }

      const index = phrases.findIndex((phrase) => phrase.id === currentPhraseId)
      const currentPhrase = phrases[index]

      if (event.code === "Space") {
        event.preventDefault()
        handlePlay(currentPhrase)
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault()
        toggleRegistry.current.get(currentPhraseId)?.()
      } else if (event.key === "ArrowLeft" && index > 0) {
        setCurrentPhraseId(phrases[index - 1].id)
      } else if (event.key === "ArrowRight" && index < phrases.length - 1) {
        setCurrentPhraseId(phrases[index + 1].id)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [currentPhraseId, recordingPhraseId])

  const completedCount = Object.keys(evaluations).length

  return (
    <div id="listening-speaking-app" className="min-h-screen bg-background">
      <TopBar
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((value) => !value)}
      />

      <div className="sticky top-14 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="container mx-auto max-w-3xl px-4 py-2">
          <ProgressBar completed={completedCount} total={phrases.length} />
        </div>
      </div>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <PhraseList
          phrases={phrases}
          difficulty={difficulty}
          focusMode={focusMode}
          currentPhraseId={currentPhraseId}
          onCurrentPhraseChange={setCurrentPhraseId}
          playingId={playingId}
          recordingPhraseId={recordingPhraseId}
          supportsSpeechRecognition={supportsSpeechRecognition}
          evaluations={evaluations}
          onPlay={handlePlay}
          onRecordingChange={handleRecordingChange}
          onEvaluation={saveEvaluation}
          registerToggle={registerToggle}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 10: Run the full test suite & typecheck** — `npm test` → all green; `npm run typecheck` → no errors.

- [ ] **Step 11: Manual browser verification** — start the dev server (`.claude/launch.json` → `dev`, port 3000). Check at desktop and mobile widths:
  - Single continuous list with spine; nodes fill as you attempt phrases; `n/36` increments.
  - Easy shows text+hint; Médio hides hint with "Ver dica" peek; Difícil hides text+hint until after recording.
  - Play → "Ouvir/Tocando…"; Record → "Repetir/Parar/Ouvindo…"; score counts up; ≥80% shows green + check.
  - Theme toggle flips light/dark with no flash on reload; green stays legible in both.
  - Focus mode shows one card with Anterior/Próxima; Space plays, R records, ←/→ navigate.

- [ ] **Step 12: Commit**

```bash
git add src/components/TopBar src/components/ProgressBar src/components/ListeningSpeakingApp/index.tsx
git commit -m "feat: add top bar, progress, and app orchestration with keyboard shortcuts"
```

---

## Task 12: Branding (package, manifest, logo, README)

**Files:**
- Modify: `package.json`, `public/manifest.json`, `src/logo.svg`, `README.md`

- [ ] **Step 1: Rename the package**

In `package.json` change `"name": "treino-friends"` → `"name": "my-pronunciation-class"`.

- [ ] **Step 2: Update the web app manifest**

Read `public/manifest.json` and set its `name` / `short_name` (whichever keys exist) to `myPronunciationClass`.

- [ ] **Step 3: Update the logo wordmark**

Read `src/logo.svg`; if it contains "Friends"/"treino" text, replace with `myPronunciationClass` (or leave the mark if it is purely graphical). Keep it monochrome.

- [ ] **Step 4: Update the README**

Set the top heading of `README.md` to `# myPronunciationClass` and update any "treino_friends"/"Friends" description of the project's purpose to describe the pronunciation trainer. Keep instructions accurate.

- [ ] **Step 5: Verify & commit** — `npm run typecheck` → no errors; `npm test` → green.

```bash
git add package.json public/manifest.json src/logo.svg README.md
git commit -m "chore: rebrand to myPronunciationClass"
```

---

## Task 13: Folder rename (LAST — invalidates the working directory)

**Files:** repo root directory.

> ⚠️ Execute this only after Tasks 1–12 are committed. Renaming the repo root changes the working directory; the dev server and editor must be reopened at the new path. The `.git` folder moves with the directory, so **all history is preserved** — this is a plain directory move, not `git mv` (the repo-root folder name is not tracked by git).

- [ ] **Step 1: Stop the dev server** (via the preview tooling / `Ctrl-C`), so no process holds the old path.

- [ ] **Step 2: Move the directory**

```bash
mv /Users/geldopc/Documents/nerdzilla/treino_friends /Users/geldopc/Documents/nerdzilla/myPronunciationClass
```

- [ ] **Step 3: Reopen at the new path & verify**

```bash
cd /Users/geldopc/Documents/nerdzilla/myPronunciationClass
git status          # clean, branch intact, full history present
git log --oneline -1
npm run dev         # boots on port 3000
```

- [ ] **Step 4: Commit any path-dependent config changes** (only if something referenced the old absolute path; `.claude/launch.json` uses `npm run dev` and needs no change). If nothing changed, no commit is needed.

---

## Self-Review

**Spec coverage** (spec §1–§11):
- §2.1 list + focus mode → Tasks 9, 10, 11. ✓
- §2.2 / §6 difficulty reveal → Tasks 2, 8 (+ tests). ✓
- §2.3 / §9 rename → Tasks 12 (branding), 13 (folder). ✓
- §2.4 stateless → no persistence added anywhere except theme; Global Constraints. ✓
- §2.5 green ≥80% → Task 7 (`green-600`/`green-500`), sole color exception. ✓
- §2.6 theme switch → Task 4 (provider + no-flash) + Task 11 (`ThemeToggle`). ✓
- §3 top bar / progress / spine / speaker chip / icon buttons / focus → Tasks 8, 9, 10, 11. ✓
- §4 architecture (TopBar/DifficultyToggle/SpeedControl/ThemeToggle, ProgressBar, PhraseList/SpineNode, PhraseCard/ScoreReveal, providers/Theme, hooks, difficulty.ts) → all created. ✓
- §5 `speaker` field → Task 3. ✓
- §7 interactivity: recording/playback states, count-up score, spine feedback, keyboard shortcuts, focus mode, aria-live → Tasks 7, 8, 11. Live waveform/level meter is intentionally omitted as YAGNI polish (pulsing "Ouvindo…" text with `aria-live` covers the essential feedback); flag for a follow-up if desired.
- §8 accessibility: aria-live, labelled controls, aria-hidden decorative icons → Tasks 7, 8, 11. ✓
- §10 testing: difficulty rules, phrases data, PhraseCard per-difficulty render, DifficultyToggle, theme toggle → Tasks 2, 3, 4, 8, 11. `text-similarity.test.ts` kept as-is. ✓

**Placeholder scan:** none. (The earlier draft's `top-[57px]` arbitrary value is already written as the compliant `top-14` in Task 11 Step 9.)

**Type consistency:** `SpeechEvaluation` defined once in `@/hooks/useSpeechRecognition` and imported everywhere (PhraseCard, ScoreReveal, PhraseList, shell); the old `@/components/PhraseCard` export is removed (Task 8 note). `PlaybackRate` defined once in `@/components/TopBar/SpeedControl`, consumed by TopBar + shell. `Difficulty` from `@/lib/difficulty` used consistently. `registerToggle` signature `(phraseId: number, toggle: (() => void) | null) => void` matches across shell → PhraseList → PhraseCard. `SpineNodeState` shared between SpineNode and PhraseList.
