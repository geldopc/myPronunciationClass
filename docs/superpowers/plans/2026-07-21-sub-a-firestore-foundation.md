# Sub-project A — Firestore Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate lesson/phrase data from static TypeScript files into Firestore, remove audio mode, and update all hooks and components to consume the new data layer — making the app ready for multi-lesson support.

**Architecture:** Pure Firestore data layer. `lessons/{lessonId}/phrases/{phraseId}` subcollection replaces `src/lib/phrases.ts`. A seed script writes the existing 36-phrase lesson as `friends-s5e14`. All hooks updated to fetch live data; static imports eliminated. No Cloud Functions — everything client-side.

**Tech Stack:** React 19, TypeScript, Tailwind v4, TanStack Router, Firebase v10 (Firestore, Auth), shadcn/ui, Vitest.

## Global Constraints

- `Phrase.id` changes from `number` to `string` everywhere — Firestore doc IDs are strings
- `audioSrc` field is removed entirely from `Phrase` type and all usages
- `playerMode` state collapses: remove "audio" option — video is the only mode
- `SOURCE_VIDEO_ID` constant is eliminated; `videoId` comes from the lesson document
- `useYouTubePlayer` gains a `videoId: string` second param (before `onError`)
- `phraseStats` doc key changes to composite: `{lessonId}_{phraseId}` (e.g. `friends-s5e14_phrase-1`)
- All `Attempt` and `PhraseStat` types gain a `lessonId: string` field
- `useProgress` gains an optional `lessonId?: string` param; for now hardcode `"friends-s5e14"` at the call site in `ListeningSpeakingApp`
- Firestore `db` is imported from `@/lib/firebase`; never re-import Firebase directly in hooks/components
- Seed script (`scripts/seed.ts`) uses Firebase Admin SDK with service account key at `scripts/serviceAccount.json` (gitignored)
- Mobile-first: no UI regression in any changed component
- `npx tsc --noEmit` must stay clean; `npx vitest run` suite must pass after each task

---

### Task 1: Create `src/lib/lessons.ts` — types + Firestore CRUD helpers

**Files:**
- Create: `src/lib/lessons.ts`
- Create: `src/lib/lessons.test.ts`

**Interfaces:**
- Produces:
  - `type Lesson { id, title, youtubeId, thumbnailUrl, createdAt, createdBy }`
  - `type Phrase { id, order, text, speaker, pronunciationHint, startTime, endTime }` (no `audioSrc`)
  - `function isPhraseReady(phrase: Phrase): boolean`
  - `function fetchLessons(): Promise<Lesson[]>`
  - `function fetchLesson(lessonId: string): Promise<Lesson | null>`
  - `function fetchPhrases(lessonId: string): Promise<Phrase[]>`

- [ ] **Step 1: Write failing tests**

```ts
// src/lib/lessons.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn((col) => col),
  orderBy: vi.fn(),
}))
vi.mock("@/lib/firebase", () => ({ db: {} }))

import { fetchLessons, fetchLesson, fetchPhrases } from "@/lib/lessons"
import { getDocs, getDoc } from "firebase/firestore"

const mockLesson = {
  id: "friends-s5e14",
  title: "Friends S5E14",
  youtubeId: "XZVHmRvfDHM",
  thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
  createdAt: 1700000000000,
  createdBy: "system",
}

describe("fetchLessons", () => {
  it("returns mapped lesson documents", async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: mockLesson.id, data: () => ({ ...mockLesson }) }],
    } as never)
    const result = await fetchLessons()
    expect(result).toEqual([mockLesson])
  })
})

describe("fetchLesson", () => {
  it("returns null when doc does not exist", async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)
    expect(await fetchLesson("unknown")).toBeNull()
  })
  it("returns lesson when doc exists", async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: mockLesson.id,
      data: () => ({ ...mockLesson }),
    } as never)
    expect(await fetchLesson("friends-s5e14")).toEqual(mockLesson)
  })
})

describe("fetchPhrases", () => {
  it("returns phrases with string id and no audioSrc", async () => {
    const mockPhrase = { id: "phrase-1", order: 1, text: "Hello", speaker: "Ross",
      pronunciationHint: "tip", startTime: 0, endTime: 3 }
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: mockPhrase.id, data: () => ({ ...mockPhrase }) }],
    } as never)
    const result = await fetchPhrases("friends-s5e14")
    expect(result[0].id).toBe("phrase-1")
    expect((result[0] as Record<string, unknown>).audioSrc).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to verify fail**

```
npx vitest run src/lib/lessons.test.ts
```
Expected: cannot find module `@/lib/lessons`

- [ ] **Step 3: Create `src/lib/lessons.ts`**

```ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export type Lesson = {
  id: string
  title: string
  youtubeId: string
  thumbnailUrl: string
  createdAt: number
  createdBy: string
}

export type Phrase = {
  id: string
  order: number
  text: string
  speaker: string
  pronunciationHint: string
  startTime: number
  endTime: number
}

export function isPhraseReady(phrase: Phrase): boolean {
  return !phrase.text.startsWith("SUBSTITUA_PELA_FRASE_")
}

export async function fetchLessons(): Promise<Lesson[]> {
  const snap = await getDocs(collection(db, "lessons"))
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lesson, "id">) }))
}

export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
  const snap = await getDoc(doc(db, "lessons", lessonId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Lesson, "id">) }
}

export async function fetchPhrases(lessonId: string): Promise<Phrase[]> {
  const q = query(
    collection(db, "lessons", lessonId, "phrases"),
    orderBy("order")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Phrase, "id">) }))
}
```

- [ ] **Step 4: Verify tests pass**

```
npx vitest run src/lib/lessons.test.ts
```
Expected: 4 passing

- [ ] **Step 5: Commit**

```bash
git add src/lib/lessons.ts src/lib/lessons.test.ts
git commit -m "feat: add lessons.ts with Firestore types and CRUD helpers"
```

---

### Task 2: Update `useYouTubePlayer` — accept `videoId` param, remove `SOURCE_VIDEO_ID` import

**Files:**
- Modify: `src/hooks/useYouTubePlayer/index.ts`

**Interfaces:**
- Consumes: nothing external changes
- Produces: `useYouTubePlayer(containerId: string, videoId: string, onError?: () => void, onSegmentEnd?: () => void)`
  — `videoId` is now param 2 (was hardcoded from `SOURCE_VIDEO_ID`)

- [ ] **Step 1: Update the hook**

Remove the import `import { SOURCE_VIDEO_ID } from "@/lib/phrases"` from the top.

Change the function signature:
```ts
export function useYouTubePlayer(
  containerId: string,
  videoId: string,
  onError?: () => void,
  onSegmentEnd?: () => void
): {
  playSegment: (start: number, end: number) => void
  pause: () => void
  setRate: (rate: number) => void
  ready: boolean
}
```

Inside `initPlayer`, change `videoId: SOURCE_VIDEO_ID` → `videoId: videoId`.

In the `useEffect` deps array (currently `[containerId, onError]`), add `videoId`:
```ts
}, [containerId, videoId, onError])
```

- [ ] **Step 2: Verify no new type errors inside the hook file**

```
npx tsc --noEmit 2>&1 | grep "useYouTubePlayer"
```
Errors at call sites (in `ListeningSpeakingApp`) are expected — fixed in Task 9.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useYouTubePlayer/index.ts
git commit -m "refactor: useYouTubePlayer accepts videoId param, removes SOURCE_VIDEO_ID import"
```

---

### Task 3: Create `src/hooks/useLessons/index.ts`

**Files:**
- Create: `src/hooks/useLessons/index.ts`
- Create: `src/hooks/useLessons/index.test.ts`

**Interfaces:**
- Consumes: `fetchLessons()` from `@/lib/lessons`
- Produces: `useLessons(): { lessons: Lesson[], loading: boolean }`

- [ ] **Step 1: Write failing test**

```ts
// src/hooks/useLessons/index.test.ts
import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

vi.mock("@/lib/lessons", () => ({
  fetchLessons: vi.fn().mockResolvedValue([
    { id: "friends-s5e14", title: "Friends S5E14", youtubeId: "XZVHmRvfDHM",
      thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
      createdAt: 1700000000000, createdBy: "system" },
  ]),
}))

import { useLessons } from "@/hooks/useLessons"

describe("useLessons", () => {
  it("starts loading and resolves lessons", async () => {
    const { result } = renderHook(() => useLessons())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.lessons).toHaveLength(1)
    expect(result.current.lessons[0].id).toBe("friends-s5e14")
  })
})
```

- [ ] **Step 2: Run to verify fail**

```
npx vitest run src/hooks/useLessons/index.test.ts
```
Expected: cannot find module

- [ ] **Step 3: Create the hook**

```ts
// src/hooks/useLessons/index.ts
import { useEffect, useState } from "react"
import { fetchLessons } from "@/lib/lessons"
import type { Lesson } from "@/lib/lessons"

export function useLessons(): { lessons: Lesson[]; loading: boolean } {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLessons()
      .then(setLessons)
      .finally(() => setLoading(false))
  }, [])

  return { lessons, loading }
}
```

- [ ] **Step 4: Verify test passes**

```
npx vitest run src/hooks/useLessons/index.test.ts
```
Expected: 1 passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLessons/index.ts src/hooks/useLessons/index.test.ts
git commit -m "feat: add useLessons hook"
```

---

### Task 4: Create `src/hooks/useLesson/index.ts`

**Files:**
- Create: `src/hooks/useLesson/index.ts`
- Create: `src/hooks/useLesson/index.test.ts`

**Interfaces:**
- Consumes: `fetchLesson`, `fetchPhrases` from `@/lib/lessons`
- Produces: `useLesson(lessonId: string): { lesson: Lesson | null, phrases: Phrase[], loading: boolean }`

- [ ] **Step 1: Write failing test**

```ts
// src/hooks/useLesson/index.test.ts
import { describe, it, expect, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"

const mockLesson = {
  id: "friends-s5e14", title: "Friends S5E14", youtubeId: "XZVHmRvfDHM",
  thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
  createdAt: 1700000000000, createdBy: "system",
}
const mockPhrase = {
  id: "phrase-1", order: 1, text: "Hey!", speaker: "Ross",
  pronunciationHint: "tip", startTime: 0, endTime: 3,
}

vi.mock("@/lib/lessons", () => ({
  fetchLesson: vi.fn().mockResolvedValue(mockLesson),
  fetchPhrases: vi.fn().mockResolvedValue([mockPhrase]),
}))

import { useLesson } from "@/hooks/useLesson"

describe("useLesson", () => {
  it("loads lesson and phrases, resolves loading", async () => {
    const { result } = renderHook(() => useLesson("friends-s5e14"))
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.lesson?.id).toBe("friends-s5e14")
    expect(result.current.phrases).toHaveLength(1)
    expect(result.current.phrases[0].id).toBe("phrase-1")
  })

  it("returns null lesson when not found", async () => {
    const { fetchLesson } = await import("@/lib/lessons")
    vi.mocked(fetchLesson).mockResolvedValueOnce(null)
    const { result } = renderHook(() => useLesson("missing"))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.lesson).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify fail**

```
npx vitest run src/hooks/useLesson/index.test.ts
```
Expected: cannot find module

- [ ] **Step 3: Create the hook**

```ts
// src/hooks/useLesson/index.ts
import { useEffect, useState } from "react"
import { fetchLesson, fetchPhrases } from "@/lib/lessons"
import type { Lesson, Phrase } from "@/lib/lessons"

export function useLesson(lessonId: string): {
  lesson: Lesson | null
  phrases: Phrase[]
  loading: boolean
} {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchLesson(lessonId), fetchPhrases(lessonId)])
      .then(([les, phr]) => {
        setLesson(les)
        setPhrases(phr)
      })
      .finally(() => setLoading(false))
  }, [lessonId])

  return { lesson, phrases, loading }
}
```

- [ ] **Step 4: Verify tests pass**

```
npx vitest run src/hooks/useLesson/index.test.ts
```
Expected: 2 passing

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useLesson/index.ts src/hooks/useLesson/index.test.ts
git commit -m "feat: add useLesson hook"
```

---

### Task 5: Update progress model and `attempts.ts` — add `lessonId`, composite phraseStats key

**Files:**
- Modify: `src/lib/progress-model.ts`
- Modify: `src/lib/attempts.ts`

**Interfaces:**
- Consumes: nothing new
- Produces:
  - `Attempt.lessonId: string`, `Attempt.phraseId: string` (was `number`)
  - `PhraseStat.lessonId: string`, `PhraseStat.phraseId: string` (was `number`)
  - `Rollups.bestScoreByPhrase: Record<string, number>` (was `Record<number, number>`)
  - `recordAttempt(uid, attempt)` writes phraseStats at composite key `{lessonId}_{phraseId}`
  - `readPhraseStats(uid, lessonId?)` filters by prefix when `lessonId` is provided

- [ ] **Step 1: Update `src/lib/progress-model.ts`**

```ts
import type { Difficulty } from "@/lib/difficulty"

export type Attempt = {
  lessonId: string
  phraseId: string
  difficulty: Difficulty
  score: number
  transcript: string
}

export type PhraseStat = {
  lessonId: string
  phraseId: string
  bestScore: number
  attemptsCount: number
  lastPracticedAt: number
}

export type Rollups = {
  completion: number
  average: number
  streak: number
  bestScoreByPhrase: Record<string, number>
}

export type ShareProfile = {
  displayName: string
  avatarUrl: string
}

export type ShareSnapshot = Rollups

export type Share = ShareProfile & {
  snapshot: ShareSnapshot
  createdAt: number
}
```

- [ ] **Step 2: Update `src/lib/attempts.ts`**

```ts
import {
  addDoc,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { Attempt, PhraseStat } from "@/lib/progress-model"

export async function recordAttempt(
  uid: string,
  attempt: Attempt
): Promise<void> {
  await addDoc(collection(db, "users", uid, "attempts"), {
    ...attempt,
    createdAt: serverTimestamp(),
  })

  const statKey = `${attempt.lessonId}_${attempt.phraseId}`
  const statRef = doc(db, "users", uid, "phraseStats", statKey)
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(statRef)
    const previous = snapshot.exists()
      ? (snapshot.data() as { bestScore: number; attemptsCount: number })
      : { bestScore: 0, attemptsCount: 0 }
    transaction.set(statRef, {
      lessonId: attempt.lessonId,
      phraseId: attempt.phraseId,
      bestScore: Math.max(previous.bestScore, attempt.score),
      attemptsCount: previous.attemptsCount + 1,
      lastPracticedAt: serverTimestamp(),
    })
  })
}

export async function readPhraseStats(
  uid: string,
  lessonId?: string
): Promise<PhraseStat[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "phraseStats"))
  return snapshot.docs
    .filter((entry) => {
      if (!lessonId) return true
      return entry.id.startsWith(`${lessonId}_`)
    })
    .map((entry) => {
      const data = entry.data() as {
        lessonId: string
        phraseId: string
        bestScore: number
        attemptsCount: number
        lastPracticedAt?: { toMillis: () => number }
      }
      return {
        lessonId: data.lessonId,
        phraseId: data.phraseId,
        bestScore: data.bestScore,
        attemptsCount: data.attemptsCount,
        lastPracticedAt: data.lastPracticedAt?.toMillis() ?? 0,
      }
    })
}

export async function readPracticeDays(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "attempts"))
  const days = new Set<string>()
  for (const entry of snapshot.docs) {
    const createdAt = (entry.data() as { createdAt?: { toDate: () => Date } })
      .createdAt
    if (createdAt) days.add(createdAt.toDate().toISOString().slice(0, 10))
  }
  return [...days]
}
```

- [ ] **Step 3: Run type check**

```
npx tsc --noEmit 2>&1 | head -40
```
Errors at call sites (useProgress, tests) are expected — fixed in Tasks 7–9.

- [ ] **Step 4: Commit**

```bash
git add src/lib/progress-model.ts src/lib/attempts.ts
git commit -m "refactor: phraseId → string, add lessonId to Attempt/PhraseStat, composite phraseStats key"
```

---

### Task 6: Update `src/hooks/useProgress/index.ts` — `lessonId?` param, string phraseId

**Files:**
- Modify: `src/hooks/useProgress/index.ts`

**Interfaces:**
- Consumes: `readPhraseStats(uid, lessonId?)` (Task 5), `computeRollups` (unchanged signature)
- Produces:
  - `useProgress(lessonId?: string): { rollups, phraseStats, loading, recordEvaluation }`
  - `recordEvaluation(phraseId: string, lessonId: string, difficulty, evaluation)` — `lessonId` is now explicit second arg

> `lessonId` is a required second argument to `recordEvaluation` so the attempt record is properly scoped. The `ListeningSpeakingApp` (Task 8) passes `"friends-s5e14"` hardcoded.

- [ ] **Step 1: Replace `src/hooks/useProgress/index.ts`**

```ts
import { useCallback, useEffect, useState } from "react"

import {
  readPhraseStats,
  readPracticeDays,
  recordAttempt,
} from "@/lib/attempts"
import { computeRollups } from "@/lib/rollups"
import { useAuth } from "@/providers/Auth"
import type { Difficulty } from "@/lib/difficulty"
import type { PhraseStat, Rollups } from "@/lib/progress-model"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"

const EMPTY: Rollups = {
  completion: 0,
  average: 0,
  streak: 0,
  bestScoreByPhrase: {},
}

export function useProgress(lessonId?: string) {
  const { user } = useAuth()
  const [rollups, setRollups] = useState<Rollups>(EMPTY)
  const [phraseStats, setPhraseStats] = useState<PhraseStat[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setRollups(EMPTY)
      setPhraseStats([])
      return
    }
    setLoading(true)
    const [stats, days] = await Promise.all([
      readPhraseStats(user.uid, lessonId),
      readPracticeDays(user.uid),
    ])
    const today = new Date().toISOString().slice(0, 10)
    setRollups(computeRollups(stats, stats.length, days, today))
    setPhraseStats([...stats].sort((a, b) => a.phraseId.localeCompare(b.phraseId)))
    setLoading(false)
  }, [user, lessonId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const recordEvaluation = useCallback(
    async (
      phraseId: string,
      lessonIdArg: string,
      difficulty: Difficulty,
      evaluation: SpeechEvaluation
    ) => {
      if (!user) return
      await recordAttempt(user.uid, {
        lessonId: lessonIdArg,
        phraseId,
        difficulty,
        score: evaluation.score,
        transcript: evaluation.transcript,
      })
      await refresh()
    },
    [user, refresh]
  )

  return { rollups, phraseStats, loading, recordEvaluation }
}
```

- [ ] **Step 2: Find and update `useProgress` tests**

```bash
grep -rn "recordEvaluation\|useProgress" src --include="*.test.*" -l
```

For each test file found, update `recordEvaluation(phraseId, difficulty, evaluation)` calls to `recordEvaluation(phraseId, "friends-s5e14", difficulty, evaluation)`. Update `readPhraseStats` mock expectations to accept an optional second arg.

- [ ] **Step 3: Run the full test suite**

```
npx vitest run
```
Expected: all previously passing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useProgress/index.ts
git commit -m "refactor: useProgress accepts lessonId param; recordEvaluation gains lessonId arg"
```

---

### Task 7: Remove audio mode — delete `useAudioPlayer`, simplify `BottomNav` and `ListeningSpeakingApp`

**Files:**
- Delete: `src/hooks/useAudioPlayer/index.ts`
- Modify: `src/components/BottomNav/index.tsx` — remove `playerMode`/`onPlayerModeChange` props and audio/video buttons
- Modify: `src/components/ListeningSpeakingApp/index.tsx` — remove audio references, simplify play logic

> Audio removal is intentional per design spec. Only YouTube video playback remains.

- [ ] **Step 1: Remove `playerMode` props from BottomNav**

In `src/components/BottomNav/index.tsx`:
- Remove from props type: `playerMode: "audio" | "video"` and `onPlayerModeChange: (mode: "audio" | "video") => void`
- Remove the two audio/video toggle buttons from JSX (the `focusMode && playerMode === "audio"` / `focusMode && playerMode === "video"` buttons)
- Remove `playerMode` and `onPlayerModeChange` from the destructured props

- [ ] **Step 2: Remove audio wiring from `ListeningSpeakingApp`**

Remove these from `src/components/ListeningSpeakingApp/index.tsx`:
- `import { useAudioPlayer } from "@/hooks/useAudioPlayer"`
- `const [playerMode, setPlayerMode] = useState<"audio" | "video">(() => { ... })`
- `const { playingId, play, stop } = useAudioPlayer(playbackRate)`
- The `useEffect` persisting `playerMode` to localStorage
- The `if (playerMode === "audio")` branch in `handlePlay`; replace with video-only logic:

```ts
const handlePlay = useCallback(
  (phrase: Phrase) => {
    if (recordingPhraseId !== null) return
    setCurrentPhraseId(phrase.id)
    if (videoPlayingId === phrase.id) {
      handleVideoPause()
    } else {
      playSegment(phrase.startTime, phrase.endTime)
      setVideoPlayingId(phrase.id)
    }
  },
  [recordingPhraseId, videoPlayingId, playSegment, handleVideoPause]
)
```

Replace `const isVideoMode = playerMode === "video" && focusMode` → `const isVideoMode = focusMode`

Replace `const effectivePlayingId = playingId ?? videoPlayingId` → `const effectivePlayingId = videoPlayingId`

Remove `playerMode` and `onPlayerModeChange` from `<BottomNav>` JSX.

- [ ] **Step 3: Delete `useAudioPlayer`**

```bash
rm src/hooks/useAudioPlayer/index.ts
# If a test file exists:
rm -f src/hooks/useAudioPlayer/index.test.ts
rmdir src/hooks/useAudioPlayer 2>/dev/null || true
```

- [ ] **Step 4: Verify**

```
npx tsc --noEmit
npx vitest run
```
Expected: tsc clean (except Task 8 call site errors); vitest passing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: remove audio mode — video-only playback, delete useAudioPlayer"
```

---

### Task 8: Wire `ListeningSpeakingApp` to `useLesson` — live Firestore data + update Phrase imports

**Files:**
- Modify: `src/components/ListeningSpeakingApp/index.tsx`
- Modify: `src/components/VideoPlayer/index.tsx`
- Modify: `src/components/PhraseCard/index.tsx`
- Modify: `src/components/PhraseList/index.tsx`

**Interfaces:**
- Consumes: `useLesson("friends-s5e14")` → `{ lesson, phrases, loading }`, `useYouTubePlayer(id, lesson.youtubeId, ...)`, `useProgress("friends-s5e14")`
- All `Phrase` imports switch from `@/lib/phrases` to `@/lib/lessons`

- [ ] **Step 1: Update `Phrase` imports in components**

In each file, change:
```ts
// FROM:
import type { Phrase } from "@/lib/phrases"
// TO:
import type { Phrase } from "@/lib/lessons"
```

Files to update:
- `src/components/VideoPlayer/index.tsx`
- `src/components/PhraseCard/index.tsx`
- `src/components/PhraseList/index.tsx`

Also scan for other consumers:
```bash
grep -rn "from.*['\"]@/lib/phrases['\"]" src/ --include="*.tsx" --include="*.ts"
```
Update any found files.

In `PhraseList`: update `phraseId: number` in props/callbacks to `phraseId: string`.
In `PhraseCard`: update `phraseId: number` to `phraseId: string` wherever it appears.

- [ ] **Step 2: Check and update SpineNode**

```bash
grep -rn "Phrase\|phraseId" src/components/SpineNode/ 2>/dev/null
```
If `Phrase` imported from `@/lib/phrases`, update to `@/lib/lessons`. If `phraseId: number`, update to `string`.

- [ ] **Step 3: Check ProgressDashboard / ProgressView for `bestScoreByPhrase` key type**

```bash
grep -rn "bestScoreByPhrase\|Record<number" src/components/ProgressDashboard/ src/components/ProgressView/ src/components/ProgressStats/ 2>/dev/null
```
Replace `Record<number, number>` with `Record<string, number>` where found.

- [ ] **Step 4: Rewrite data loading in `ListeningSpeakingApp`**

Replace static imports and state at the top of the component:

```ts
// Remove: import { phrases } from "@/lib/phrases"
// Remove: import type { Phrase } from "@/lib/phrases"
// Add:
import { useLesson } from "@/hooks/useLesson"
import type { Phrase } from "@/lib/lessons"

// Inside the component body, replace hardcoded phrases with:
const HARDCODED_LESSON_ID = "friends-s5e14"
const { lesson, phrases, loading: lessonLoading } = useLesson(HARDCODED_LESSON_ID)
const { recordEvaluation } = useProgress(HARDCODED_LESSON_ID)
```

Update `currentPhraseId` initial state (needs phrases loaded first — use empty string as initial):
```ts
const [currentPhraseId, setCurrentPhraseId] = useState<string>("")
// Add effect to set first phrase once loaded:
useEffect(() => {
  if (phrases.length > 0 && currentPhraseId === "") {
    setCurrentPhraseId(phrases[0].id)
  }
}, [phrases, currentPhraseId])
```

Pass `lesson?.youtubeId ?? ""` to `useYouTubePlayer`:
```ts
const youtubeId = lesson?.youtubeId ?? ""
const { playSegment, pause, setRate } = useYouTubePlayer(
  "yt-player",
  youtubeId,
  handleVideoError,
  handleVideoSegmentEnd
)
```

Add loading guard before main return:
```tsx
if (lessonLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <span className="text-sm text-muted-foreground">Carregando lição…</span>
    </div>
  )
}
```

Update `saveEvaluation` signature:
```ts
function saveEvaluation(phraseId: string, evaluation: SpeechEvaluation) {
  setEvaluations((current) => ({ ...current, [phraseId]: evaluation }))
  void recordEvaluation(phraseId, HARDCODED_LESSON_ID, difficulty, evaluation)
}
```

Update adopt-on-login effect:
```ts
useEffect(() => {
  if (!user || adoptedRef.current) return
  adoptedRef.current = true
  for (const [phraseId, evaluation] of Object.entries(evaluations)) {
    void recordEvaluation(phraseId, HARDCODED_LESSON_ID, difficulty, evaluation)
  }
}, [user, evaluations, difficulty, recordEvaluation])
```

- [ ] **Step 5: Full verification**

```
npx tsc --noEmit
npx vitest run
npx eslint src
```
Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire ListeningSpeakingApp to useLesson; Phrase.id is now string across all components"
```

---

### Task 9: Write `firestore.rules`

**Files:**
- Create: `firestore.rules`

**Interfaces:**
- Produces: Firestore security rules with `isActiveAdmin()` helper
- Deployed separately via Firebase CLI (`firebase deploy --only firestore:rules`)

- [ ] **Step 1: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isActiveAdmin() {
      return request.auth != null &&
             exists(/databases/$(database)/documents/admins/$(request.auth.token.email)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.token.email)).data.status == "active";
    }

    match /lessons/{lessonId} {
      allow read: if true;
      allow write: if isActiveAdmin();

      match /phrases/{phraseId} {
        allow read: if true;
        allow write: if isActiveAdmin();
      }
    }

    match /admins/{email} {
      allow read: if isActiveAdmin();
      allow create: if isActiveAdmin();

      allow update: if request.auth != null
                    && request.auth.token.email == email
                    && resource.data.status == "invited"
                    && request.resource.data.status == "active"
                    && request.resource.data.keys().hasAll(
                         ['status', 'invitedBy', 'invitedAt', 'activatedAt'])
                    && request.resource.data.keys().size() == 4;

      allow delete: if isActiveAdmin();
    }

    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add firestore.rules
git commit -m "feat: add firestore.rules with isActiveAdmin() helper"
```

---

### Task 10: Write seed migration script `scripts/seed.ts`

**Files:**
- Create: `scripts/seed.ts`
- Create: `scripts/tsconfig.seed.json`

**Interfaces:**
- Consumes: `firebase-admin` (Node.js SDK), `scripts/serviceAccount.json` (gitignored)
- Writes: `lessons/friends-s5e14`, `lessons/friends-s5e14/phrases/phrase-{n}`, `admins/geldopc@gmail.com`
- Idempotent: uses `set(..., { merge: true })` so safe to re-run

- [ ] **Step 1: Check and install `firebase-admin` + `tsx`**

```bash
npm list firebase-admin 2>/dev/null | grep firebase-admin || npm install --save-dev firebase-admin tsx
```

- [ ] **Step 2: Create `scripts/tsconfig.seed.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["seed.ts"]
}
```

- [ ] **Step 3: Add `scripts/serviceAccount.json` to `.gitignore`**

```bash
grep -q "serviceAccount.json" .gitignore || echo "scripts/serviceAccount.json" >> .gitignore
```

- [ ] **Step 4: Create `scripts/seed.ts`**

```ts
import * as admin from "firebase-admin"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccount.json"), "utf-8")
)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const phrasesData = [
  { order: 1, speaker: "Chandler", text: "Damn, Rolos. Hey, you're back! Hey, how was your conference?", pronunciationHint: '"you\'re" reduz para /jɚ/ ("yer"). "how was" conecta como "how-wuz".', startTime: 0.0, endTime: 8.395 },
  { order: 2, speaker: "Rachel", text: "It was terrible. I fought with", pronunciationHint: '"It was" contrai para "it-wuz". "fought with" liga o /t/ final ao /w/.', startTime: 8.395, endTime: 10.823 },
  { order: 3, speaker: "Rachel", text: "My colleagues, you know, the entire time. Are you kidding?", pronunciationHint: '"Are you" reduz para /ɚjə/ ("ar-ya"). "kidding" tem flap-t no meio.', startTime: 10.823, endTime: 13.657 },
  { order: 4, speaker: "Chandler", text: "With this? So your weekend was a total bust?", pronunciationHint: '"total" tem flap-t: soa "toh-dl". "your" reduz para /jɚ/.', startTime: 13.657, endTime: 17.946 },
  { order: 5, speaker: "Rachel", text: "Uh, no. I got to see Donald Trump waiting for an elevator.", pronunciationHint: '"got to" vira "gotta" /ˈɡɑːtə/. "waiting for an" conecta tudo sem pausas.', startTime: 17.946, endTime: 22.731 },
  { order: 6, speaker: "Chandler", text: "Hi. Hey, you're back, too. Yeah.", pronunciationHint: '"you\'re" reduzido /jɚ/. "too" com vogal longa /uː/ no fim.', startTime: 22.731, endTime: 25.75 },
  { order: 7, speaker: "Ross", text: "Yeah, Chandler, can I talk to you outside for just a second?", pronunciationHint: '"can I" conecta como "kuh-nai". "talk to you" reduz "to" para /tə/.', startTime: 25.75, endTime: 28.11 },
  { order: 8, speaker: "Rachel", text: "Hey, how was your chef thing?", pronunciationHint: '"was your" liga em "wuh-zher".', startTime: 28.11, endTime: 29.985 },
  { order: 9, speaker: "Monica", text: "It was awful. I guess some people just don't appreciate really good food. Well, maybe it was the kind of food that tasted good at first, but then made everybody vomit and have diarrhea.", pronunciationHint: '"don\'t" com /t/ quase mudo antes de consoante. "kind of" reduz para "kinda". Flap-t em "tasted".', startTime: 29.985, endTime: 39.484 },
  { order: 10, speaker: "Rachel", text: "Chandler? Monica?", pronunciationHint: "Nomes próprios em tom de pergunta chamando alguém: entonação subindo no final.", startTime: 39.484, endTime: 44.795 },
  { order: 11, speaker: "Rachel", text: "Mr. Bing?", pronunciationHint: '"Mister" reduz para /ˈmɪstɚ/, quase sem o "i" central.', startTime: 44.795, endTime: 49.806 },
  { order: 12, speaker: "Rachel", text: "That hotel you stayed at called. Said someone left an eyelash curler in your room.", pronunciationHint: '"stayed at" linka o /d/ ao /æ/. "eyelash curler" com "r" americano forte.', startTime: 49.806, endTime: 56.52 },
  { order: 13, speaker: "Chandler", text: "Yes, that was mine. 'Cause I figured you hooked up with some girl and she left it there.", pronunciationHint: '"\'Cause" é redução de "because", soa /kəz/. "hooked up with" encadeia sem pausas.', startTime: 56.52, endTime: 65.936 },
  { order: 14, speaker: "Rachel", text: "Yes, that would have made more sense.", pronunciationHint: '"would have" reduz para "would\'ve" /ˈwʊdəv/, nunca pronuncie o "have" cheio.', startTime: 65.936, endTime: 67.912 },
  { order: 15, speaker: "Ross", text: "You know, I don't even feel like I know you anymore, man. All right?", pronunciationHint: '"don\'t even" perde o /t/ de "don\'t". "anymore" vira uma palavra só na fala corrida.', startTime: 67.912, endTime: 74.791 },
  { order: 16, speaker: "Ross", text: "Look, I'm just gonna ask you this one time, all right? And whatever you say, I'll believe you.", pronunciationHint: '"gonna" = "going to" reduzido. "ask you" funde o /k/ ao /j/, quase "askyuh".', startTime: 74.791, endTime: 80.11 },
  { order: 17, speaker: "Ross", text: "Were you, or were you not, on a gay cruise?", pronunciationHint: '"Were you" reduz para "wer-yuh". Pausa curta antes de "on a gay cruise" para dar ênfase.', startTime: 80.11, endTime: 87.733 },
  { order: 18, speaker: "Chandler", text: "Hey. Hey. Hey. Oh, hey, Monica.", pronunciationHint: 'Cada "Hey" com entonação diferente: cumprimento, resposta, depois reconhecimento ("Oh, hey").', startTime: 87.733, endTime: 90.957 },
  { order: 19, speaker: "Rachel", text: "I heard you saw Donald Trump at your convention. Yeah, saw him waiting for an elevator.", pronunciationHint: '"heard you" funde /d/ + /j/ perto de "herjuh". "saw him" quase perde o "h": "saw-im".', startTime: 90.957, endTime: 95.072 },
  { order: 20, speaker: "Monica", text: "Hey, Rachel, can I borrow your eyelash curler? I think I lost mine.", pronunciationHint: '"can I borrow" encadeia rápido. "think I" liga o /k/ ao /aɪ/ sem pausa.', startTime: 95.072, endTime: 101.154 },
  { order: 21, speaker: "Chandler", text: "Joey, can I talk to you for a second?", pronunciationHint: '"can I" soa "kuh-nai". "talk to you" reduz "to" para /tə/, igual à frase 7.', startTime: 106.86, endTime: 111.5 },
  { order: 22, speaker: "Joey", text: "Yes. Yes. You? And you?", pronunciationHint: '"And you" conecta "d" + "y" quase como "an-juh". Cada palavra isolada, sem juntar.', startTime: 122.935, endTime: 131.939 },
  { order: 23, speaker: "Monica", text: "Yes, but you cannot tell anyone, no one knows. How, when?", pronunciationHint: '"cannot" aqui é enfático, não reduz (diferente de "can\'t"). "tell anyone" liga o /l/ ao /ɛ/.', startTime: 131.939, endTime: 137.405 },
  { order: 24, speaker: "Chandler", text: "It happened in London.", pronunciationHint: '"happened in" liga o /d/ ao /ɪ/ sem pausa. "London" com "o" curto /ʌ/.', startTime: 137.405, endTime: 139.746 },
  { order: 25, speaker: "Joey", text: "In London?! The reason we didn't tell anyone was because we didn't want to make a big deal out of it.", pronunciationHint: '"didn\'t" tem o /t/ quase engolido antes de consoante. "want to" reduz para "wanna".', startTime: 139.746, endTime: 147.457 },
  { order: 26, speaker: "Monica", text: "But it is a big deal!", pronunciationHint: '"But it is" conecta "t" + vogal: "buh-tit-iz".', startTime: 147.457, endTime: 149.316 },
  { order: 27, speaker: "Joey", text: "I have to tell someone. You can't.", pronunciationHint: '"have to" reduz para "hafta". "can\'t" com vogal mais longa e /t/ final marcado.', startTime: 149.316, endTime: 154.225 },
  { order: 28, speaker: "Chandler", text: "Please, please, we just don't want to deal with telling everyone, okay?", pronunciationHint: '"want to" reduz para "wanna". "deal with" conecta o /l/ ao /w/ sem pausa.', startTime: 154.225, endTime: 157.403 },
  { order: 29, speaker: "Monica", text: "Just promise you won't tell.", pronunciationHint: '"won\'t" tem vogal /oʊ/ bem aberta — não confundir com "want". "promise you" funde /s/ + /j/.', startTime: 157.403, endTime: 159.188 },
  { order: 30, speaker: "Joey", text: "All right!", pronunciationHint: '"All right" vira quase uma palavra só, "awright", com entonação de aceitação resignada.', startTime: 160.624, endTime: 166.313 },
  { order: 31, speaker: "Joey", text: "Man, this is unbelievable! I mean, it's great, but", pronunciationHint: '"this is" conecta o /s/ final ao /ɪ/. "it\'s great" junta o /s/ ao /ɡ/ sem pausa.', startTime: 166.313, endTime: 172.082 },
  { order: 32, speaker: "Monica", text: "I know it's great.", pronunciationHint: '"I know" com ditongo /oʊ/ completo. "it\'s great" sem pausa entre as palavras.', startTime: 172.082, endTime: 175.366 },
  { order: 33, speaker: "Joey", text: "Oh, I don't want to see that.", pronunciationHint: '"want to" reduz para "wanna". Na fala rápida soa quase "dohn-wanna see that".', startTime: 175.366, endTime: 180.454 },
  { order: 34, speaker: "Monica", text: "We're so stupid.", pronunciationHint: '"We\'re" reduz para /wɪr/. "stupid" com flap-t no meio, som suave de "d".', startTime: 180.454, endTime: 182.477 },
  { order: 35, speaker: "Rachel", text: "Do you know what's going on in there?", pronunciationHint: '"Do you" funde em "d\'ya". "going on" e "on in" ligam vogal a vogal sem pausa.', startTime: 182.477, endTime: 185.618 },
  { order: 36, speaker: "Joey", text: "They're trying to take Joey.", pronunciationHint: '"trying to" reduz para "tryna" na fala informal. "take Joey" com o "J" bem marcado /dʒ/.', startTime: 185.618, endTime: 190.337 },
]

async function seed() {
  const LESSON_ID = "friends-s5e14"
  const ADMIN_EMAIL = "geldopc@gmail.com"

  console.log("Seeding lesson…")
  await db.collection("lessons").doc(LESSON_ID).set(
    {
      title: "Friends S5E14 — Joey Finds Out",
      youtubeId: "XZVHmRvfDHM",
      thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: "system",
    },
    { merge: true }
  )

  console.log("Seeding 36 phrases…")
  const batch = db.batch()
  for (const p of phrasesData) {
    const phraseId = `phrase-${p.order}`
    const ref = db.collection("lessons").doc(LESSON_ID).collection("phrases").doc(phraseId)
    batch.set(ref, p, { merge: true })
  }
  await batch.commit()

  console.log("Seeding admin…")
  await db.collection("admins").doc(ADMIN_EMAIL).set(
    {
      status: "active",
      invitedBy: "system",
      invitedAt: admin.firestore.Timestamp.now(),
      activatedAt: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  )

  console.log(`Done! Seeded ${LESSON_ID} with ${phrasesData.length} phrases + admin ${ADMIN_EMAIL}`)
}

seed().catch((err) => { console.error(err); process.exit(1) })
```

- [ ] **Step 5: Add npm script to `package.json`**

In the `"scripts"` block, add:
```json
"seed": "npx tsx --tsconfig scripts/tsconfig.seed.json scripts/seed.ts"
```

- [ ] **Step 6: Type-check the seed script**

```bash
npx tsc --project scripts/tsconfig.seed.json --noEmit
```
Expected: clean (no `serviceAccount.json` needed for type check).

- [ ] **Step 7: Commit**

```bash
git add scripts/seed.ts scripts/tsconfig.seed.json package.json .gitignore
git commit -m "feat: add seed migration script for friends-s5e14 lesson"
```

---

### Task 11: Delete old static files + final verification

**Files:**
- Delete: `src/lib/phrases.ts`
- Delete: `src/lib/pronunciationTips.ts`
- Delete: `src/hooks/useAudioPlayer/index.ts` (if still present)

- [ ] **Step 1: Verify no remaining imports**

```bash
grep -rn "from.*['\"]@/lib/phrases['\"]" src/
grep -rn "from.*['\"]@/lib/pronunciationTips['\"]" src/
grep -rn "from.*['\"]@/hooks/useAudioPlayer['\"]" src/
```
Expected: zero matches. Fix any that appear before deleting.

- [ ] **Step 2: Delete the files**

```bash
rm src/lib/phrases.ts
rm src/lib/pronunciationTips.ts
rm -f src/hooks/useAudioPlayer/index.ts
rmdir src/hooks/useAudioPlayer 2>/dev/null || true
```

- [ ] **Step 3: Full suite**

```
npx tsc --noEmit
npx vitest run
npx eslint src
npx vite build 2>&1 | tail -5
```
Expected: all clean, build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: delete phrases.ts, pronunciationTips.ts, useAudioPlayer — replaced by Firestore data layer"
```

---

## Summary of Files Changed

| Action | File |
|--------|------|
| Create | `src/lib/lessons.ts` |
| Create | `src/lib/lessons.test.ts` |
| Create | `src/hooks/useLessons/index.ts` |
| Create | `src/hooks/useLessons/index.test.ts` |
| Create | `src/hooks/useLesson/index.ts` |
| Create | `src/hooks/useLesson/index.test.ts` |
| Create | `firestore.rules` |
| Create | `scripts/seed.ts` |
| Create | `scripts/tsconfig.seed.json` |
| Modify | `src/hooks/useYouTubePlayer/index.ts` |
| Modify | `src/lib/progress-model.ts` |
| Modify | `src/lib/attempts.ts` |
| Modify | `src/hooks/useProgress/index.ts` |
| Modify | `src/components/BottomNav/index.tsx` |
| Modify | `src/components/ListeningSpeakingApp/index.tsx` |
| Modify | `src/components/VideoPlayer/index.tsx` |
| Modify | `src/components/PhraseCard/index.tsx` |
| Modify | `src/components/PhraseList/index.tsx` |
| Delete | `src/lib/phrases.ts` |
| Delete | `src/lib/pronunciationTips.ts` |
| Delete | `src/hooks/useAudioPlayer/index.ts` |
