# Sub-project B — Accounts, Progress & Sharing (Firebase) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional Google login, persisted practice history, a personal `/progress` view, and a public read-only `/s/:slug` share link to the existing static pronunciation trainer — without requiring login and without leaving GitHub Pages.

**Architecture:** Firebase used purely as a client-side SDK (Auth + Firestore). An `AuthProvider` mirrors the existing `ThemeProvider`. A `useProgress` hook persists each recognition score (`attempts` doc + a transacted `phraseStats` rollup) and exposes derived rollups. `/progress` and the public `/s/:slug` share a presentational `ProgressStats` component; the public page renders from an aggregates-only `snapshot` stored on `shares/{slug}` so Security Rules stay trivial.

**Tech Stack:** TanStack Start (SPA/static), React 19, TypeScript, Tailwind v4, shadcn/ui, `firebase` v10+ (`firebase/app`, `firebase/auth`, `firebase/firestore`), Vitest + Testing Library (jsdom), `@firebase/rules-unit-testing` for rules.

## Global Constraints

- Login is **optional**; the anonymous path must behave exactly as today (in-memory, ephemeral). Copied from spec: "the app behaves exactly as today (ephemeral, nothing saved to the cloud)."
- Stay **static on GitHub Pages**, same URL. No server functions. Firebase web config is non-secret (identifier), supplied via `import.meta.env.VITE_FIREBASE_*`.
- Share page exposes **aggregates + Google display name/avatar only — never transcripts, never raw attempts.**
- Scope is **phases 1–4** (auth, persistence, progress view, sharing). Out of scope: anon localStorage persistence across reloads, full anon→account merge, rich OG previews, opt-in transcript sharing, account deletion, rate limiting.
- Metrics: **best score per phrase, completion %, average of best scores, simple streak.**
- Follow `CLAUDE.md`: directories snakeCase under `src`; a component is a CamelCase folder with only `index.tsx`; `export function` (never `export default`); an `id` attribute on every component; imports use the `@/` alias (never relative); shadcn components when available; Phosphor/lucide icons imported with the `Icon` suffix; **no arbitrary Tailwind values** (e.g. no `w-[123px]`); do not change the colors in `index.css` (minimal black & white — the `green` ≥80 success accent from Sub-project A is the only allowed exception); no commented-out code.
- Tests: no Vitest `globals` — every test imports `{ describe, it, expect, afterEach }` from `"vitest"` explicitly, starts component test files with `// @vitest-environment jsdom`, and calls `afterEach(cleanup)` (from `@testing-library/react`) when rendering.

---

## File Structure

**Create:**
- `src/lib/firebaseConfig.ts` — the config object read from `import.meta.env`.
- `src/lib/firebase.ts` — initializes the app once; exports `auth`, `db`, `googleProvider`.
- `src/lib/progress-model.ts` — shared domain types (`Attempt`, `PhraseStat`, `Rollups`, `ShareProfile`, `ShareSnapshot`, `Share`).
- `src/lib/rollups.ts` — pure rollup math (`computeRollups`, `computeStreak`).
- `src/lib/attempts.ts` — Firestore attempt/phraseStat data access.
- `src/lib/shares.ts` — Firestore share create/read/revoke + slug generation.
- `src/providers/Auth/index.tsx` — `AuthProvider` + `useAuth`.
- `src/hooks/useProgress/index.ts` — persistence + rollups for the logged-in user.
- `src/hooks/useShareLink/index.ts` — share create/revoke state.
- `src/components/TopBar/AuthControl/index.tsx` — login button / avatar menu.
- `src/components/ProgressStats/index.tsx` — presentational stats (shared by `/progress` and `/s/:slug`).
- `src/components/ProgressView/index.tsx` — logged-in dashboard (own data + share controls).
- `src/components/ShareView/index.tsx` — public read-only render from a snapshot.
- `src/routes/progress.tsx` — `/progress` route (logged-in only).
- `src/routes/s.$slug.tsx` — `/s/:slug` public route.
- `firestore.rules`, `firebase.json` — Security Rules + emulator config.
- `.env.example` — the six `VITE_FIREBASE_*` keys.
- `src/components/ui/dropdown-menu.tsx`, `src/components/ui/avatar.tsx` — via shadcn.

**Modify:**
- `src/routes/__root.tsx` — wrap `AuthProvider` inside `RootDocument`.
- `src/components/TopBar/index.tsx` — render `AuthControl`.
- `src/components/ListeningSpeakingApp/index.tsx` — persist evaluations + adopt-on-login.
- `.gitignore` — ignore `.env*`.
- `.github/workflows/deploy.yml` — pass `VITE_FIREBASE_*` at build.
- `package.json` — add `firebase`; add dev dep `@firebase/rules-unit-testing`.
- `README.md` — Firebase setup section.

---

## Task 1: Firebase SDK, init module, and env config

**Files:**
- Create: `src/lib/firebaseConfig.ts`, `src/lib/firebase.ts`, `.env.example`
- Modify: `.gitignore`, `.github/workflows/deploy.yml`, `package.json`
- Test: `src/lib/firebase.test.ts`

**Interfaces:**
- Produces: `auth: Auth`, `db: Firestore`, `googleProvider: GoogleAuthProvider` from `@/lib/firebase`; `firebaseConfig` from `@/lib/firebaseConfig`.

**Operational prerequisite (user, one-time):** In the Firebase console create a project (Spark plan), enable **Google** as an Auth sign-in provider, add `geldopc.github.io` and `localhost` to **Authorized domains**, create a **Firestore** database (production mode), then copy the web-app config into a local `.env` and into GitHub repo **Variables** (`Settings → Secrets and variables → Actions → Variables`) as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.

- [ ] **Step 1: Install firebase**

Run: `npm install firebase`

- [ ] **Step 2: Ignore env files**

Append to `.gitignore`:

```
.env
.env.local
.env.*.local
```

- [ ] **Step 3: Create `.env.example`**

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 4: Type the env vars** — create `src/vite-env.d.ts`

```ts
interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

- [ ] **Step 5: Create `src/lib/firebaseConfig.ts`**

```ts
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}
```

- [ ] **Step 6: Write the failing test** — `src/lib/firebase.test.ts`

```ts
import { describe, expect, it, vi } from "vitest"

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "app" })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: "app" })),
}))
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ __brand: "auth" })),
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
}))
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({ __brand: "db" })),
}))

describe("firebase init", () => {
  it("exports auth, db and a google provider", async () => {
    const mod = await import("@/lib/firebase")
    expect(mod.auth).toEqual({ __brand: "auth" })
    expect(mod.db).toEqual({ __brand: "db" })
    expect(mod.googleProvider).toBeInstanceOf((await import("firebase/auth")).GoogleAuthProvider)
  })
})
```

- [ ] **Step 7: Run it and watch it fail**

Run: `npx vitest run src/lib/firebase.test.ts`
Expected: FAIL — `Cannot find module '@/lib/firebase'`.

- [ ] **Step 8: Create `src/lib/firebase.ts`**

```ts
import { getApp, getApps, initializeApp } from "firebase/app"
import { GoogleAuthProvider, getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

import { firebaseConfig } from "@/lib/firebaseConfig"

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
```

- [ ] **Step 9: Run the test — expect PASS**

Run: `npx vitest run src/lib/firebase.test.ts`

- [ ] **Step 10: Pass env at build** — edit `.github/workflows/deploy.yml`, add an `env:` block to the `npm run build` step:

```yaml
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ vars.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ vars.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ vars.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ vars.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ vars.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ vars.VITE_FIREBASE_APP_ID }}
```

- [ ] **Step 11: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/lib/firebase.ts src/lib/firebaseConfig.ts src/lib/firebase.test.ts src/vite-env.d.ts .env.example .gitignore .github/workflows/deploy.yml package.json package-lock.json
git commit -m "feat: add firebase client init and env config"
```

---

## Task 2: Domain types + pure rollup math

**Files:**
- Create: `src/lib/progress-model.ts`, `src/lib/rollups.ts`
- Test: `src/lib/rollups.test.ts`

**Interfaces:**
- Produces (`@/lib/progress-model`):
  - `type Attempt = { phraseId: number; difficulty: Difficulty; score: number; transcript: string }`
  - `type PhraseStat = { phraseId: number; bestScore: number; attemptsCount: number; lastPracticedAt: number }`
  - `type Rollups = { completion: number; average: number; streak: number; bestScoreByPhrase: Record<number, number> }`
  - `type ShareProfile = { displayName: string; avatarUrl: string }`
  - `type ShareSnapshot = Rollups`
  - `type Share = ShareProfile & { snapshot: ShareSnapshot; createdAt: number }`
- Produces (`@/lib/rollups`):
  - `computeRollups(stats: PhraseStat[], total: number, practiceDays: string[], today: string): Rollups`
  - `computeStreak(days: string[], today: string): number`

- [ ] **Step 1: Create `src/lib/progress-model.ts`**

```ts
import type { Difficulty } from "@/lib/difficulty"

export type Attempt = {
  phraseId: number
  difficulty: Difficulty
  score: number
  transcript: string
}

export type PhraseStat = {
  phraseId: number
  bestScore: number
  attemptsCount: number
  lastPracticedAt: number
}

export type Rollups = {
  completion: number
  average: number
  streak: number
  bestScoreByPhrase: Record<number, number>
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

- [ ] **Step 2: Write the failing test** — `src/lib/rollups.test.ts`

```ts
import { describe, expect, it } from "vitest"

import { computeRollups, computeStreak } from "@/lib/rollups"
import type { PhraseStat } from "@/lib/progress-model"

const stat = (phraseId: number, bestScore: number): PhraseStat => ({
  phraseId,
  bestScore,
  attemptsCount: 1,
  lastPracticedAt: 0,
})

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak(["2026-07-12", "2026-07-11", "2026-07-10"], "2026-07-12")).toBe(3)
  })
  it("is zero when today has no practice", () => {
    expect(computeStreak(["2026-07-10"], "2026-07-12")).toBe(0)
  })
  it("stops at the first gap", () => {
    expect(computeStreak(["2026-07-12", "2026-07-10"], "2026-07-12")).toBe(1)
  })
})

describe("computeRollups", () => {
  it("derives completion, average and best-score map", () => {
    const r = computeRollups([stat(1, 90), stat(2, 70)], 4, ["2026-07-12"], "2026-07-12")
    expect(r.completion).toBe(50)
    expect(r.average).toBe(80)
    expect(r.bestScoreByPhrase).toEqual({ 1: 90, 2: 70 })
    expect(r.streak).toBe(1)
  })
  it("is all-zero with no stats", () => {
    const r = computeRollups([], 4, [], "2026-07-12")
    expect(r).toEqual({ completion: 0, average: 0, streak: 0, bestScoreByPhrase: {} })
  })
})
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run src/lib/rollups.test.ts`
Expected: FAIL — `Cannot find module '@/lib/rollups'`.

- [ ] **Step 4: Create `src/lib/rollups.ts`**

```ts
import type { PhraseStat, Rollups } from "@/lib/progress-model"

export function computeRollups(
  stats: PhraseStat[],
  total: number,
  practiceDays: string[],
  today: string
): Rollups {
  const practiced = stats.filter((item) => item.attemptsCount > 0)
  const completion =
    total === 0 ? 0 : Math.round((practiced.length / total) * 100)
  const average =
    practiced.length === 0
      ? 0
      : Math.round(
          practiced.reduce((sum, item) => sum + item.bestScore, 0) /
            practiced.length
        )
  const bestScoreByPhrase = Object.fromEntries(
    stats.map((item) => [item.phraseId, item.bestScore])
  )
  return { completion, average, streak: computeStreak(practiceDays, today), bestScoreByPhrase }
}

export function computeStreak(days: string[], today: string): number {
  const set = new Set(days)
  let streak = 0
  let cursor = today
  while (set.has(cursor)) {
    streak += 1
    cursor = previousDay(cursor)
  }
  return streak
}

function previousDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}
```

- [ ] **Step 5: Run the test (PASS) and commit**

Run: `npx vitest run src/lib/rollups.test.ts`

```bash
git add src/lib/progress-model.ts src/lib/rollups.ts src/lib/rollups.test.ts
git commit -m "feat: add progress domain types and rollup math"
```

---

## Task 3: AuthProvider + useAuth

**Files:**
- Create: `src/providers/Auth/index.tsx`
- Modify: `src/routes/__root.tsx`
- Test: `src/providers/Auth/index.test.tsx`

**Interfaces:**
- Consumes: `auth`, `googleProvider` from `@/lib/firebase`.
- Produces: `useAuth(): { user: AuthUser | null; loading: boolean; signInWithGoogle: () => Promise<void>; signOut: () => Promise<void> }` where `type AuthUser = { uid: string; displayName: string; avatarUrl: string }`. `AuthProvider({ children })`.

- [ ] **Step 1: Write the failing test** — `src/providers/Auth/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

let authCallback: ((user: unknown) => void) | null = null

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, cb: (user: unknown) => void) => {
    authCallback = cb
    return () => {}
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock("@/lib/firebase", () => ({ auth: {}, googleProvider: {} }))

import { AuthProvider, useAuth } from "@/providers/Auth"

function Probe() {
  const { user, loading } = useAuth()
  if (loading) return <span>loading</span>
  return <span>{user ? user.displayName : "anon"}</span>
}

afterEach(() => {
  cleanup()
  authCallback = null
})

describe("AuthProvider", () => {
  it("starts loading, then resolves to anon and to a signed-in user", () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    expect(screen.getByText("loading")).toBeTruthy()

    authCallback?.(null)
    expect(screen.getByText("anon")).toBeTruthy()

    authCallback?.({ uid: "u1", displayName: "Ada", photoURL: "http://x/a.png" })
    expect(screen.getByText("Ada")).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/providers/Auth/index.test.tsx`
Expected: FAIL — `Cannot find module '@/providers/Auth'`.

- [ ] **Step 3: Create `src/providers/Auth/index.tsx`**

```tsx
import { createContext, useContext, useEffect, useState } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth"

import { auth, googleProvider } from "@/lib/firebase"

export type AuthUser = {
  uid: string
  displayName: string
  avatarUrl: string
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(
        firebaseUser
          ? {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName ?? "Aluno",
              avatarUrl: firebaseUser.photoURL ?? "",
            }
          : null
      )
      setLoading(false)
    })
  }, [])

  async function signInWithGoogle() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx vitest run src/providers/Auth/index.test.tsx`

- [ ] **Step 5: Wrap the app** — in `src/routes/__root.tsx`, import `AuthProvider` and nest it inside `ThemeProvider`:

```tsx
import { AuthProvider } from "@/providers/Auth"
```

Change the body wrapper to:

```tsx
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
```

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/providers/Auth/index.tsx src/providers/Auth/index.test.tsx src/routes/__root.tsx
git commit -m "feat: add auth provider with google sign-in"
```

---

## Task 4: Attempts & shares data access

**Files:**
- Create: `src/lib/attempts.ts`, `src/lib/shares.ts`
- Test: `src/lib/attempts.test.ts`, `src/lib/shares.test.ts`

**Interfaces:**
- Consumes: `db` from `@/lib/firebase`; types from `@/lib/progress-model`.
- Produces (`@/lib/attempts`):
  - `recordAttempt(uid: string, attempt: Attempt): Promise<void>`
  - `readPhraseStats(uid: string): Promise<PhraseStat[]>`
  - `readPracticeDays(uid: string): Promise<string[]>`
- Produces (`@/lib/shares`):
  - `generateSlug(): string`
  - `createShare(uid: string, profile: ShareProfile, snapshot: ShareSnapshot): Promise<string>` (returns slug)
  - `readShare(slug: string): Promise<Share | null>`
  - `revokeShare(uid: string, slug: string): Promise<void>`

- [ ] **Step 1: Write the failing test** — `src/lib/attempts.test.ts`

```ts
import { describe, expect, it, vi } from "vitest"

const addDoc = vi.fn(async () => ({ id: "a1" }))
const runTransaction = vi.fn(async (_db, fn) => {
  await fn({
    get: async () => ({ exists: () => false, data: () => undefined }),
    set: vi.fn(),
    update: vi.fn(),
  })
})
vi.mock("firebase/firestore", () => ({
  addDoc,
  runTransaction,
  collection: vi.fn((...args) => ["collection", ...args]),
  doc: vi.fn((...args) => ["doc", ...args]),
  getDocs: vi.fn(async () => ({ docs: [] })),
  serverTimestamp: vi.fn(() => "ts"),
}))
vi.mock("@/lib/firebase", () => ({ db: {} }))

import { recordAttempt } from "@/lib/attempts"

describe("recordAttempt", () => {
  it("appends an attempt and upserts the phrase stat in a transaction", async () => {
    await recordAttempt("u1", {
      phraseId: 3,
      difficulty: "easy",
      score: 88,
      transcript: "hello",
    })
    expect(addDoc).toHaveBeenCalledTimes(1)
    expect(runTransaction).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/lib/attempts.test.ts`
Expected: FAIL — `Cannot find module '@/lib/attempts'`.

- [ ] **Step 3: Create `src/lib/attempts.ts`**

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

export async function recordAttempt(uid: string, attempt: Attempt): Promise<void> {
  await addDoc(collection(db, "users", uid, "attempts"), {
    ...attempt,
    createdAt: serverTimestamp(),
  })

  const statRef = doc(db, "users", uid, "phraseStats", String(attempt.phraseId))
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(statRef)
    const previous = snapshot.exists()
      ? (snapshot.data() as { bestScore: number; attemptsCount: number })
      : { bestScore: 0, attemptsCount: 0 }
    transaction.set(statRef, {
      phraseId: attempt.phraseId,
      bestScore: Math.max(previous.bestScore, attempt.score),
      attemptsCount: previous.attemptsCount + 1,
      lastPracticedAt: serverTimestamp(),
    })
  })
}

export async function readPhraseStats(uid: string): Promise<PhraseStat[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "phraseStats"))
  return snapshot.docs.map((entry) => {
    const data = entry.data() as {
      phraseId: number
      bestScore: number
      attemptsCount: number
      lastPracticedAt?: { toMillis: () => number }
    }
    return {
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

- [ ] **Step 4: Run the attempts test — expect PASS**

Run: `npx vitest run src/lib/attempts.test.ts`

- [ ] **Step 5: Write the failing test** — `src/lib/shares.test.ts`

```ts
import { describe, expect, it, vi } from "vitest"

const setDoc = vi.fn(async () => undefined)
const updateDoc = vi.fn(async () => undefined)
const deleteDoc = vi.fn(async () => undefined)
const getDoc = vi.fn(async () => ({ exists: () => false, data: () => undefined }))
vi.mock("firebase/firestore", () => ({
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  doc: vi.fn((...args) => ["doc", ...args]),
  serverTimestamp: vi.fn(() => "ts"),
}))
vi.mock("@/lib/firebase", () => ({ db: {} }))

import { createShare, generateSlug, readShare } from "@/lib/shares"

describe("shares", () => {
  it("generates an unguessable slug", () => {
    const a = generateSlug()
    const b = generateSlug()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(12)
  })
  it("creates a public share doc and links it on the user", async () => {
    const slug = await createShare(
      "u1",
      { displayName: "Ada", avatarUrl: "http://x/a.png" },
      { completion: 50, average: 80, streak: 1, bestScoreByPhrase: { 1: 90 } }
    )
    expect(typeof slug).toBe("string")
    expect(setDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledTimes(1)
  })
  it("returns null for a missing share", async () => {
    expect(await readShare("nope")).toBeNull()
  })
})
```

- [ ] **Step 6: Create `src/lib/shares.ts`**

```ts
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { Share, ShareProfile, ShareSnapshot } from "@/lib/progress-model"

export function generateSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("")
}

export async function createShare(
  uid: string,
  profile: ShareProfile,
  snapshot: ShareSnapshot
): Promise<string> {
  const slug = generateSlug()
  await setDoc(doc(db, "shares", slug), {
    uid,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    snapshot,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, "users", uid), { shareSlug: slug, shareEnabled: true })
  return slug
}

export async function readShare(slug: string): Promise<Share | null> {
  const snapshot = await getDoc(doc(db, "shares", slug))
  if (!snapshot.exists()) return null
  const data = snapshot.data() as {
    displayName: string
    avatarUrl: string
    snapshot: ShareSnapshot
    createdAt?: { toMillis: () => number }
  }
  return {
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    snapshot: data.snapshot,
    createdAt: data.createdAt?.toMillis() ?? 0,
  }
}

export async function revokeShare(uid: string, slug: string): Promise<void> {
  await deleteDoc(doc(db, "shares", slug))
  await updateDoc(doc(db, "users", uid), { shareSlug: null, shareEnabled: false })
}
```

- [ ] **Step 7: Run the shares test (PASS) and commit**

Run: `npx vitest run src/lib/attempts.test.ts src/lib/shares.test.ts`

```bash
git add src/lib/attempts.ts src/lib/attempts.test.ts src/lib/shares.ts src/lib/shares.test.ts
git commit -m "feat: add firestore data access for attempts and shares"
```

---

## Task 5: useProgress hook

**Files:**
- Create: `src/hooks/useProgress/index.ts`
- Test: `src/hooks/useProgress/index.test.tsx`

**Interfaces:**
- Consumes: `useAuth` from `@/providers/Auth`; `recordAttempt`, `readPhraseStats`, `readPracticeDays` from `@/lib/attempts`; `computeRollups` from `@/lib/rollups`; `SpeechEvaluation` from `@/hooks/useSpeechRecognition`; `Difficulty` from `@/lib/difficulty`.
- Produces: `useProgress(): { rollups: Rollups; loading: boolean; recordEvaluation: (phraseId: number, difficulty: Difficulty, evaluation: SpeechEvaluation) => Promise<void> }`.

**Note:** `recordEvaluation` is a no-op persistence-wise when logged out (the practice UI keeps its own in-memory state). `today` is `new Date().toISOString().slice(0, 10)` (allowed in app runtime).

- [ ] **Step 1: Write the failing test** — `src/hooks/useProgress/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const recordAttempt = vi.fn(async () => undefined)
vi.mock("@/lib/attempts", () => ({
  recordAttempt,
  readPhraseStats: vi.fn(async () => [
    { phraseId: 1, bestScore: 90, attemptsCount: 1, lastPracticedAt: 0 },
  ]),
  readPracticeDays: vi.fn(async () => []),
}))
let mockUser: { uid: string; displayName: string; avatarUrl: string } | null = {
  uid: "u1",
  displayName: "Ada",
  avatarUrl: "",
}
vi.mock("@/providers/Auth", () => ({ useAuth: () => ({ user: mockUser, loading: false }) }))

import { useProgress } from "@/hooks/useProgress"

function Probe() {
  const { rollups, recordEvaluation } = useProgress()
  return (
    <button
      type="button"
      onClick={() => recordEvaluation(2, "easy", { transcript: "hi", score: 70 })}
    >
      {rollups.completion}
    </button>
  )
}

afterEach(() => {
  cleanup()
  recordAttempt.mockClear()
  mockUser = { uid: "u1", displayName: "Ada", avatarUrl: "" }
})

describe("useProgress", () => {
  it("persists an evaluation for a logged-in user", async () => {
    render(<Probe />)
    await screen.findByRole("button")
    screen.getByRole("button").click()
    expect(recordAttempt).toHaveBeenCalledWith("u1", {
      phraseId: 2,
      difficulty: "easy",
      score: 70,
      transcript: "hi",
    })
  })

  it("does not persist when logged out", async () => {
    mockUser = null
    render(<Probe />)
    screen.getByRole("button").click()
    expect(recordAttempt).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/hooks/useProgress/index.test.tsx`
Expected: FAIL — `Cannot find module '@/hooks/useProgress'`.

- [ ] **Step 3: Create `src/hooks/useProgress/index.ts`**

```ts
import { useCallback, useEffect, useState } from "react"

import { readPhraseStats, readPracticeDays, recordAttempt } from "@/lib/attempts"
import { computeRollups } from "@/lib/rollups"
import { phrases } from "@/lib/phrases"
import { useAuth } from "@/providers/Auth"
import type { Difficulty } from "@/lib/difficulty"
import type { Rollups } from "@/lib/progress-model"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"

const EMPTY: Rollups = {
  completion: 0,
  average: 0,
  streak: 0,
  bestScoreByPhrase: {},
}

export function useProgress() {
  const { user } = useAuth()
  const [rollups, setRollups] = useState<Rollups>(EMPTY)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setRollups(EMPTY)
      return
    }
    setLoading(true)
    const [stats, days] = await Promise.all([
      readPhraseStats(user.uid),
      readPracticeDays(user.uid),
    ])
    const today = new Date().toISOString().slice(0, 10)
    setRollups(computeRollups(stats, phrases.length, days, today))
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const recordEvaluation = useCallback(
    async (
      phraseId: number,
      difficulty: Difficulty,
      evaluation: SpeechEvaluation
    ) => {
      if (!user) return
      await recordAttempt(user.uid, {
        phraseId,
        difficulty,
        score: evaluation.score,
        transcript: evaluation.transcript,
      })
      await refresh()
    },
    [user, refresh]
  )

  return { rollups, loading, recordEvaluation }
}
```

- [ ] **Step 4: Run the test (PASS) and commit**

Run: `npx vitest run src/hooks/useProgress/index.test.tsx`

```bash
git add src/hooks/useProgress/index.ts src/hooks/useProgress/index.test.tsx
git commit -m "feat: add useProgress hook persisting attempts and rollups"
```

---

## Task 6: Persist evaluations + adopt-on-login in the orchestrator

**Files:**
- Modify: `src/components/ListeningSpeakingApp/index.tsx`
- Test: `src/components/ListeningSpeakingApp/index.test.tsx`

**Interfaces:**
- Consumes: `useProgress` from `@/hooks/useProgress`; `useAuth` from `@/providers/Auth`.

**Design:** the in-memory `evaluations` state stays the source of truth for the practice UI (anonymous path unchanged). Two additions: (1) in `saveEvaluation`, also call `recordEvaluation` (no-op when logged out); (2) when `user` transitions from `null` to set, adopt any evaluations already collected this session by replaying them through `recordEvaluation` once.

- [ ] **Step 1: Write the failing test** — `src/components/ListeningSpeakingApp/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const recordEvaluation = vi.fn(async () => undefined)
vi.mock("@/hooks/useProgress", () => ({
  useProgress: () => ({ rollups: { completion: 0, average: 0, streak: 0, bestScoreByPhrase: {} }, loading: false, recordEvaluation }),
}))
vi.mock("@/providers/Auth", () => ({ useAuth: () => ({ user: { uid: "u1", displayName: "Ada", avatarUrl: "" }, loading: false, signInWithGoogle: vi.fn(), signOut: vi.fn() }) }))

import { ListeningSpeakingApp } from "@/components/ListeningSpeakingApp"

afterEach(() => {
  cleanup()
  recordEvaluation.mockClear()
})

describe("ListeningSpeakingApp persistence", () => {
  it("renders and exposes a persistence hook without breaking the anonymous UI", () => {
    const { container } = render(<ListeningSpeakingApp />)
    expect(container.querySelector("#listening-speaking-app")).toBeTruthy()
    expect(recordEvaluation).not.toHaveBeenCalled()
  })
})
```

> The full persistence path (a recognition score triggering `recordEvaluation`) is covered by the `useProgress` test in Task 5; this test guards that wiring `useProgress`/`useAuth` into the orchestrator does not regress the render.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/components/ListeningSpeakingApp/index.test.tsx`
Expected: FAIL — hook not yet wired (module imports resolve, assertions run) or file mismatch; confirm it fails before wiring.

- [ ] **Step 3: Wire the hook** — in `src/components/ListeningSpeakingApp/index.tsx`:

Add imports:

```tsx
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"
```

Inside the component, after the existing `useState` calls:

```tsx
  const { user } = useAuth()
  const { recordEvaluation } = useProgress()
  const adoptedRef = useRef(false)
```

Replace `saveEvaluation` with:

```tsx
  function saveEvaluation(phraseId: number, evaluation: SpeechEvaluation) {
    setEvaluations((current) => ({ ...current, [phraseId]: evaluation }))
    void recordEvaluation(phraseId, difficulty, evaluation)
  }
```

Add an adopt-on-login effect (replays this session's in-memory evaluations once when a user appears):

```tsx
  useEffect(() => {
    if (!user || adoptedRef.current) return
    adoptedRef.current = true
    for (const [phraseId, evaluation] of Object.entries(evaluations)) {
      void recordEvaluation(Number(phraseId), difficulty, evaluation)
    }
  }, [user, evaluations, difficulty, recordEvaluation])
```

- [ ] **Step 4: Run the test (PASS)**

Run: `npx vitest run src/components/ListeningSpeakingApp/index.test.tsx`

- [ ] **Step 5: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/ListeningSpeakingApp/index.tsx src/components/ListeningSpeakingApp/index.test.tsx
git commit -m "feat: persist evaluations and adopt anonymous session on login"
```

---

## Task 7: Auth control in the top bar

**Files:**
- Create: `src/components/TopBar/AuthControl/index.tsx`
- Create (via shadcn): `src/components/ui/dropdown-menu.tsx`, `src/components/ui/avatar.tsx`
- Modify: `src/components/TopBar/index.tsx`
- Test: `src/components/TopBar/AuthControl/index.test.tsx`

**Interfaces:**
- Consumes: `useAuth` from `@/providers/Auth`; TanStack `Link` from `@tanstack/react-router`.

- [ ] **Step 1: Add shadcn components**

Run: `npx shadcn@latest add dropdown-menu avatar`
Expected: creates `src/components/ui/dropdown-menu.tsx` and `src/components/ui/avatar.tsx`.

- [ ] **Step 2: Write the failing test** — `src/components/TopBar/AuthControl/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const signInWithGoogle = vi.fn()
let mockUser: { uid: string; displayName: string; avatarUrl: string } | null = null
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({ user: mockUser, loading: false, signInWithGoogle, signOut: vi.fn() }),
}))
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }))

import { AuthControl } from "@/components/TopBar/AuthControl"

afterEach(() => {
  cleanup()
  signInWithGoogle.mockClear()
  mockUser = null
})

describe("AuthControl", () => {
  it("shows a sign-in button when logged out and calls signIn", () => {
    render(<AuthControl />)
    const button = screen.getByRole("button", { name: /entrar/i })
    fireEvent.click(button)
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it("shows the user avatar trigger when logged in", () => {
    mockUser = { uid: "u1", displayName: "Ada", avatarUrl: "" }
    render(<AuthControl />)
    expect(screen.getByRole("button", { name: /ada/i })).toBeTruthy()
  })
})
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx vitest run src/components/TopBar/AuthControl/index.test.tsx`
Expected: FAIL — `Cannot find module '@/components/TopBar/AuthControl'`.

- [ ] **Step 4: Create `src/components/TopBar/AuthControl/index.tsx`**

```tsx
import { Link } from "@tanstack/react-router"
import { LogOutIcon, TrendingUpIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/Auth"

export function AuthControl() {
  const { user, signInWithGoogle, signOut } = useAuth()

  if (!user) {
    return (
      <Button
        id="auth-sign-in"
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void signInWithGoogle()}
      >
        Entrar
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          id="auth-menu-trigger"
          type="button"
          variant="ghost"
          size="icon"
          aria-label={user.displayName}
        >
          <Avatar className="size-7">
            <AvatarImage src={user.avatarUrl} alt="" />
            <AvatarFallback>{user.displayName.slice(0, 1)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to="/progress">
            <TrendingUpIcon />
            Meu progresso
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOutIcon />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npx vitest run src/components/TopBar/AuthControl/index.test.tsx`

- [ ] **Step 6: Render it in the top bar** — in `src/components/TopBar/index.tsx`, import and place `AuthControl` as the last child of the controls `div` (after `<ThemeToggle />`):

```tsx
import { AuthControl } from "@/components/TopBar/AuthControl"
```

```tsx
          <ThemeToggle />
          <AuthControl />
```

- [ ] **Step 7: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/TopBar/AuthControl src/components/TopBar/index.tsx src/components/ui/dropdown-menu.tsx src/components/ui/avatar.tsx
git commit -m "feat: add auth control with sign-in button and user menu"
```

---

## Task 8: Presentational ProgressStats + logged-in ProgressView + /progress route

**Files:**
- Create: `src/components/ProgressStats/index.tsx`, `src/components/ProgressView/index.tsx`, `src/routes/progress.tsx`
- Test: `src/components/ProgressStats/index.test.tsx`

**Interfaces:**
- Consumes: `Rollups` from `@/lib/progress-model`; `ProgressBar` from `@/components/ProgressBar`; `SpineNode` from `@/components/PhraseList/SpineNode`; `phrases` from `@/lib/phrases`; `useProgress`, `useAuth`.
- Produces: `ProgressStats({ rollups, displayName, avatarUrl })`; `ProgressView()` (own data + share section from Task 9).

- [ ] **Step 1: Write the failing test** — `src/components/ProgressStats/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ProgressStats } from "@/components/ProgressStats"

afterEach(cleanup)

describe("ProgressStats", () => {
  it("renders completion, average and streak from rollups", () => {
    render(
      <ProgressStats
        displayName="Ada"
        avatarUrl=""
        rollups={{ completion: 50, average: 80, streak: 3, bestScoreByPhrase: { 1: 90 } }}
      />
    )
    expect(screen.getByText(/80/)).toBeTruthy()
    expect(screen.getByText(/3/)).toBeTruthy()
    expect(screen.getByText("Ada")).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/components/ProgressStats/index.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ProgressStats'`.

- [ ] **Step 3: Create `src/components/ProgressStats/index.tsx`**

```tsx
import { ProgressBar } from "@/components/ProgressBar"
import { SpineNode } from "@/components/PhraseList/SpineNode"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { phrases } from "@/lib/phrases"
import type { Rollups } from "@/lib/progress-model"

type ProgressStatsProps = {
  rollups: Rollups
  displayName: string
  avatarUrl: string
}

export function ProgressStats({ rollups, displayName, avatarUrl }: ProgressStatsProps) {
  const completed = Object.values(rollups.bestScoreByPhrase).length

  return (
    <section id="progress-stats" className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback>{displayName.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="text-lg font-semibold tracking-tight">{displayName}</span>
      </div>

      <ProgressBar completed={completed} total={phrases.length} />

      <dl className="grid grid-cols-3 gap-4 text-center">
        <div>
          <dt className="text-sm text-muted-foreground">Conclusão</dt>
          <dd className="text-2xl font-semibold">{rollups.completion}%</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Média</dt>
          <dd className="text-2xl font-semibold">{rollups.average}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Sequência</dt>
          <dd className="text-2xl font-semibold">{rollups.streak}</dd>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-2">
        {phrases.map((phrase) => (
          <li key={phrase.id} className="flex items-center gap-1">
            <SpineNode
              phraseId={phrase.id}
              state={phrase.id in rollups.bestScoreByPhrase ? "done" : "untouched"}
            />
            <span className="text-xs text-muted-foreground">
              {rollups.bestScoreByPhrase[phrase.id] ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx vitest run src/components/ProgressStats/index.test.tsx`

- [ ] **Step 5: Create `src/components/ProgressView/index.tsx`**

```tsx
import { ProgressStats } from "@/components/ProgressStats"
import { ShareControl } from "@/hooks/useShareLink/ShareControl"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"

export function ProgressView() {
  const { user } = useAuth()
  const { rollups } = useProgress()

  if (!user) return null

  return (
    <main id="progress-view" className="container mx-auto max-w-3xl px-4 py-8">
      <ProgressStats
        rollups={rollups}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />
      <div className="mt-8">
        <ShareControl rollups={rollups} />
      </div>
    </main>
  )
}
```

> `ShareControl` is created in Task 9. If executing strictly in order, stub it as `export function ShareControl() { return null }` at `src/hooks/useShareLink/ShareControl/index.tsx` now and flesh it out in Task 9; the import path is `@/hooks/useShareLink/ShareControl`.

- [ ] **Step 6: Create `src/routes/progress.tsx`**

```tsx
import { Navigate, createFileRoute } from "@tanstack/react-router"

import { ProgressView } from "@/components/ProgressView"
import { useAuth } from "@/providers/Auth"

export const Route = createFileRoute("/progress")({ component: ProgressPage })

function ProgressPage() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" />
  return <ProgressView />
}
```

- [ ] **Step 7: Typecheck and commit**

Run: `npx tsc --noEmit` (regenerates `src/routeTree.gen.ts` on next dev/build — do not hand-edit it)

```bash
git add src/components/ProgressStats src/components/ProgressView src/routes/progress.tsx
git commit -m "feat: add progress view and /progress route"
```

---

## Task 9: Share link hook + control

**Files:**
- Create: `src/hooks/useShareLink/index.ts`, `src/hooks/useShareLink/ShareControl/index.tsx`
- Test: `src/hooks/useShareLink/index.test.tsx`

**Interfaces:**
- Consumes: `useAuth`; `createShare`, `revokeShare` from `@/lib/shares`; `Rollups` from `@/lib/progress-model`.
- Produces: `useShareLink(rollups: Rollups): { slug: string | null; shareUrl: string | null; creating: boolean; create: () => Promise<void>; revoke: () => Promise<void> }`; `ShareControl({ rollups })`.

**Note on `ShareControl` folder:** it is a sub-component of the `useShareLink` hook feature; it lives at `src/hooks/useShareLink/ShareControl/index.tsx` (CamelCase component folder, only `index.tsx`). The share URL is `` `${window.location.origin}${import.meta.env.BASE_URL}s/${slug}` `` — base-aware, matching the GitHub Pages subpath.

- [ ] **Step 1: Write the failing test** — `src/hooks/useShareLink/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const createShare = vi.fn(async () => "slug123")
vi.mock("@/lib/shares", () => ({ createShare, revokeShare: vi.fn(async () => undefined) }))
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({ user: { uid: "u1", displayName: "Ada", avatarUrl: "" } }),
}))

import { useShareLink } from "@/hooks/useShareLink"

const rollups = { completion: 50, average: 80, streak: 1, bestScoreByPhrase: { 1: 90 } }

function Probe() {
  const { shareUrl, create } = useShareLink(rollups)
  return (
    <button type="button" onClick={() => void create()}>
      {shareUrl ?? "no-link"}
    </button>
  )
}

afterEach(() => {
  cleanup()
  createShare.mockClear()
})

describe("useShareLink", () => {
  it("creates a share and exposes a base-aware url", async () => {
    render(<Probe />)
    screen.getByRole("button").click()
    await screen.findByText(/s\/slug123$/)
    expect(createShare).toHaveBeenCalledWith(
      "u1",
      { displayName: "Ada", avatarUrl: "" },
      rollups
    )
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/hooks/useShareLink/index.test.tsx`
Expected: FAIL — `Cannot find module '@/hooks/useShareLink'`.

- [ ] **Step 3: Create `src/hooks/useShareLink/index.ts`**

```ts
import { useCallback, useState } from "react"

import { createShare, revokeShare } from "@/lib/shares"
import { useAuth } from "@/providers/Auth"
import type { Rollups } from "@/lib/progress-model"

function buildShareUrl(slug: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}s/${slug}`
}

export function useShareLink(rollups: Rollups) {
  const { user } = useAuth()
  const [slug, setSlug] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const create = useCallback(async () => {
    if (!user) return
    setCreating(true)
    const created = await createShare(
      user.uid,
      { displayName: user.displayName, avatarUrl: user.avatarUrl },
      rollups
    )
    setSlug(created)
    setCreating(false)
  }, [user, rollups])

  const revoke = useCallback(async () => {
    if (!user || !slug) return
    await revokeShare(user.uid, slug)
    setSlug(null)
  }, [user, slug])

  return {
    slug,
    shareUrl: slug ? buildShareUrl(slug) : null,
    creating,
    create,
    revoke,
  }
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx vitest run src/hooks/useShareLink/index.test.tsx`

- [ ] **Step 5: Create `src/hooks/useShareLink/ShareControl/index.tsx`** (replaces any stub from Task 8)

```tsx
import { Button } from "@/components/ui/button"
import { useShareLink } from "@/hooks/useShareLink"
import type { Rollups } from "@/lib/progress-model"

export function ShareControl({ rollups }: { rollups: Rollups }) {
  const { shareUrl, creating, create, revoke } = useShareLink(rollups)

  return (
    <div id="share-control" className="flex flex-col gap-3">
      {shareUrl ? (
        <>
          <input
            id="share-url"
            readOnly
            value={shareUrl}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
            >
              Copiar
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => void revoke()}>
              Revogar
            </Button>
          </div>
        </>
      ) : (
        <Button type="button" size="sm" disabled={creating} onClick={() => void create()}>
          Compartilhar meu progresso
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/hooks/useShareLink
git commit -m "feat: add share link hook and control"
```

---

## Task 10: Public share page + /s/:slug route

**Files:**
- Create: `src/components/ShareView/index.tsx`, `src/routes/s.$slug.tsx`
- Test: `src/components/ShareView/index.test.tsx`

**Interfaces:**
- Consumes: `readShare` from `@/lib/shares`; `ProgressStats` from `@/components/ProgressStats`; `Share` from `@/lib/progress-model`.
- Produces: `ShareView({ slug })`.

- [ ] **Step 1: Write the failing test** — `src/components/ShareView/index.test.tsx`

```tsx
// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const readShare = vi.fn()
vi.mock("@/lib/shares", () => ({ readShare }))

import { ShareView } from "@/components/ShareView"

afterEach(() => {
  cleanup()
  readShare.mockReset()
})

describe("ShareView", () => {
  it("renders the snapshot for a valid slug", async () => {
    readShare.mockResolvedValue({
      displayName: "Ada",
      avatarUrl: "",
      createdAt: 0,
      snapshot: { completion: 50, average: 80, streak: 2, bestScoreByPhrase: { 1: 90 } },
    })
    render(<ShareView slug="slug123" />)
    await waitFor(() => expect(screen.getByText("Ada")).toBeTruthy())
    expect(screen.getByText(/80/)).toBeTruthy()
  })

  it("shows a not-found state for a missing slug", async () => {
    readShare.mockResolvedValue(null)
    render(<ShareView slug="nope" />)
    await waitFor(() => expect(screen.getByText(/não encontrado/i)).toBeTruthy())
  })
})
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/components/ShareView/index.test.tsx`
Expected: FAIL — `Cannot find module '@/components/ShareView'`.

- [ ] **Step 3: Create `src/components/ShareView/index.tsx`**

```tsx
import { useEffect, useState } from "react"

import { ProgressStats } from "@/components/ProgressStats"
import { readShare } from "@/lib/shares"
import type { Share } from "@/lib/progress-model"

type LoadState =
  | { status: "loading" }
  | { status: "found"; share: Share }
  | { status: "missing" }

export function ShareView({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    let active = true
    void readShare(slug).then((share) => {
      if (!active) return
      setState(share ? { status: "found", share } : { status: "missing" })
    })
    return () => {
      active = false
    }
  }, [slug])

  if (state.status === "loading") {
    return <main id="share-view" className="container mx-auto max-w-3xl px-4 py-16" />
  }

  if (state.status === "missing") {
    return (
      <main id="share-view" className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Link não encontrado ou revogado.</p>
      </main>
    )
  }

  return (
    <main id="share-view" className="container mx-auto max-w-3xl px-4 py-8">
      <ProgressStats
        rollups={state.share.snapshot}
        displayName={state.share.displayName}
        avatarUrl={state.share.avatarUrl}
      />
    </main>
  )
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npx vitest run src/components/ShareView/index.test.tsx`

- [ ] **Step 5: Create `src/routes/s.$slug.tsx`**

```tsx
import { createFileRoute } from "@tanstack/react-router"

import { ShareView } from "@/components/ShareView"

export const Route = createFileRoute("/s/$slug")({ component: SharePage })

function SharePage() {
  const { slug } = Route.useParams()
  return <ShareView slug={slug} />
}
```

- [ ] **Step 6: Typecheck and commit**

Run: `npx tsc --noEmit`

```bash
git add src/components/ShareView src/routes/s.$slug.tsx
git commit -m "feat: add public share page and /s/:slug route"
```

---

## Task 11: Firestore Security Rules + rules tests

**Files:**
- Create: `firestore.rules`, `firebase.json`, `tests/firestore-rules.test.ts`
- Modify: `package.json` (add dev dep + `test:rules` script)

**Interfaces:** none (infra). Rules mirror spec §6.

**Operational:** requires the Firebase CLI emulator. The rules test runs against `firebase emulators:exec`.

- [ ] **Step 1: Install the rules test helper**

Run: `npm install -D @firebase/rules-unit-testing firebase-tools`

- [ ] **Step 2: Create `firestore.rules`**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    match /shares/{slug} {
      allow read: if true;
      allow create, update, delete:
        if request.auth != null && request.resource.data.uid == request.auth.uid;
    }
  }
}
```

- [ ] **Step 3: Create `firebase.json`**

```json
{
  "firestore": { "rules": "firestore.rules" },
  "emulators": { "firestore": { "port": 8080 }, "singleProjectMode": true }
}
```

- [ ] **Step 4: Write the rules test** — `tests/firestore-rules.test.ts`

```ts
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { readFileSync } from "node:fs"
import { afterAll, beforeAll, describe, it } from "vitest"

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-mpc",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  })
})

afterAll(async () => {
  await env.cleanup()
})

describe("firestore rules", () => {
  it("lets a user read/write their own doc but not another's", async () => {
    const ada = env.authenticatedContext("ada").firestore()
    await assertSucceeds(setDoc(doc(ada, "users/ada"), { displayName: "Ada" }))
    await assertFails(getDoc(doc(ada, "users/bob")))
  })

  it("allows public read of shares but forbids forging another uid", async () => {
    const ada = env.authenticatedContext("ada").firestore()
    const anon = env.unauthenticatedContext().firestore()
    await assertSucceeds(setDoc(doc(ada, "shares/s1"), { uid: "ada", snapshot: {} }))
    await assertSucceeds(getDoc(doc(anon, "shares/s1")))
    await assertFails(setDoc(doc(ada, "shares/s2"), { uid: "bob", snapshot: {} }))
  })
})
```

- [ ] **Step 5: Add a rules-test script** — in `package.json` `scripts`:

```json
"test:rules": "firebase emulators:exec --only firestore --project demo-mpc \"vitest run tests/firestore-rules.test.ts\""
```

- [ ] **Step 6: Run the rules test — expect PASS**

Run: `npm run test:rules`
Expected: emulator boots, all assertions pass.

- [ ] **Step 7: Publish rules (operational) + commit**

The user publishes rules once with `npx firebase deploy --only firestore:rules --project <projectId>` (or pastes them in the console).

```bash
git add firestore.rules firebase.json tests/firestore-rules.test.ts package.json package-lock.json
git commit -m "feat: add firestore security rules and emulator tests"
```

---

## Task 12: Full verification, browser pass, and docs

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Full check suite**

Run: `npx tsc --noEmit && npx vitest run && npx eslint src`
Expected: types clean, all tests green, 0 lint problems.

- [ ] **Step 2: Manual browser pass** (dev server: `.claude/launch.json` → `dev`, port 3000; requires a real Firebase project + local `.env`)

Verify at desktop and mobile widths:
- Logged out: the app works exactly as before; a "Entrar" button shows in the top bar.
- Click "Entrar" → Google popup → returns signed in; avatar menu appears.
- Practice a phrase while signed in → reload `/` → re-open `/progress` → the score persisted.
- `/progress` shows completion %, average, streak, and the 36-node grid with best scores.
- "Compartilhar meu progresso" → a `/s/<slug>` URL appears; open it in a private window (logged out) → the read-only snapshot renders with name/avatar and no transcripts.
- "Revogar" → the private-window page now shows "Link não encontrado ou revogado."
- Adopt-on-login: practice one phrase logged out, then sign in → that attempt appears under `/progress`.

Fix any issue in a small follow-up commit.

- [ ] **Step 3: Update `README.md`** — add a "Firebase setup" section documenting: create the project, enable Google auth, add authorized domains (`geldopc.github.io`, `localhost`), create Firestore, publish `firestore.rules`, set local `.env` from `.env.example`, and set the same `VITE_FIREBASE_*` as GitHub Actions repo **Variables** for deploys.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document firebase setup for accounts and sharing"
```

---

## Self-Review (completed during authoring)

- **Spec coverage:** §1 architecture → Tasks 1, 3; §2 data model → Tasks 2, 4; §3 auth+anon flow → Tasks 3, 6, 7; §4 progress view → Task 8; §5 public share → Tasks 9, 10; §6 rules → Task 11; §7 testing/conventions → every task + Task 12. Decisions (Firebase, phases 1–4, metrics, aggregates-only privacy) all reflected.
- **Type consistency:** `Rollups`/`PhraseStat`/`ShareSnapshot`/`Share`/`AuthUser` defined once (Tasks 2–3) and consumed unchanged downstream; `recordEvaluation(phraseId, difficulty, evaluation)`, `useShareLink(rollups)`, `readShare(slug)`, `createShare(uid, profile, snapshot)` signatures match across producers and consumers.
- **Placeholder scan:** the only deliberate forward reference is `ShareControl` (used in Task 8, created in Task 9) — flagged inline with a stub instruction. Firebase config values are user-supplied credentials via `.env`, not code placeholders.
