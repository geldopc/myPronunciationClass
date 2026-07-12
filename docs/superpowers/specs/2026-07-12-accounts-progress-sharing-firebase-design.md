# Accounts, Progress & Sharing — Design (Sub-project B)

**Date:** 2026-07-12
**Status:** Approved design — ready for implementation planning.
**Supersedes:** the architecture options in `2026-07-11-accounts-progress-sharing-plan.md`
(that doc predates the decision to ship the app as a static SPA on GitHub Pages).

## Context

Sub-project A shipped a fully client-side, stateless pronunciation trainer, deployed as a
static SPA on GitHub Pages at `https://geldopc.github.io/myPronunciationClass/`. There is
**no server runtime**. Sub-project B adds optional accounts, persisted practice history, a
personal progress view, and a public shareable results link — **without requiring login**
and **without leaving GitHub Pages**.

## Decisions locked during brainstorming

- **Backend: Firebase (BaaS).** Firebase Auth (Google) + Firestore, used as a client-side
  SDK. Chosen over Vercel+Postgres (would change the public URL) and Supabase (free tier
  pauses after ~7 days idle). Firebase Spark plan does not pause and Google sign-in is
  trivial. Trade-off accepted: the public share page is client-rendered, so pasted links
  have no rich OG preview (noted as a future enhancement).
- **Scope of this spec: phases 1–4** — auth, persistence, progress view, public sharing.
  Full anonymous→account migration and local persistence across reloads (phase 5) are
  deferred.
- **Metrics:** best score per phrase, completion %, average of best scores, simple streak.
- **Share privacy:** aggregates only, never transcripts. Shows the user's Google display
  name + avatar. Link is revocable.

## 1. Architecture

The app stays static on GitHub Pages (same URL). Firebase is a client-side dependency only.
The Firebase web config (apiKey, authDomain, projectId, …) ships in the bundle — it is an
identifier, not a secret; security comes from Firestore Security Rules + Auth. The
`geldopc.github.io` origin is added to Firebase Auth's authorized domains.

New modules (following existing conventions — snakeCase dirs, one folder per component/
provider/hook with `index.tsx`/`index.ts`, `export function`, `@/` imports):

- `src/lib/firebase.ts` — initializes the Firebase app once; exports `auth`, `db`
  (Firestore), and `googleProvider`.
- `src/providers/Auth/index.tsx` — `AuthProvider` + `useAuth()` returning
  `{ user, loading, signInWithGoogle, signOut }`. Subscribes with `onAuthStateChanged`.
  Mirrors the existing `ThemeProvider` pattern. Wrapped in `__root.tsx` alongside
  `ThemeProvider`.
- `src/hooks/useProgress/index.ts` — for the logged-in user: writes attempts, maintains
  `phraseStats`, and exposes the derived rollups the progress + share views consume.
- `src/hooks/useShareLink/index.ts` — creates, reads, and revokes the public share doc.

Login uses `signInWithPopup(googleProvider)` (popup avoids the redirect-handler/subpath
issues that `signInWithRedirect` has on a github.io subpath).

## 2. Data model (Firestore)

```
users/{uid}
  displayName        string        (from Google)
  avatarUrl          string        (from Google)
  createdAt          timestamp
  shareSlug          string | null (the active public slug, if any)
  shareEnabled       boolean

users/{uid}/attempts/{attemptId}          — append-only private history
  phraseId           number
  difficulty         "easy" | "moderate" | "hard"
  score              number        (0–100)
  transcript         string
  createdAt          timestamp

users/{uid}/phraseStats/{phraseId}        — rollup powering the progress view
  bestScore          number
  attemptsCount      number
  lastPracticedAt    timestamp

shares/{slug}                             — public, read-only snapshot
  uid                string
  displayName        string
  avatarUrl          string
  snapshot           { phraseStats: {phraseId: bestScore}, completion, average, streak }
  createdAt          timestamp
```

- `attempts` is the append-only event log (private history).
- `phraseStats` is updated in the **same client-side write** as the attempt (a lightweight
  Firestore transaction reading the current stat and writing the new best/count) — no Cloud
  Function needed.
- `shares/{slug}` stores a **snapshot** of the aggregates so the public page can render
  without reading any private collection (see §6). The snapshot is (re)written when the user
  creates/refreshes the share.

## 3. Auth + anonymous flow

- **TopBar** gains a right-aligned control: logged out → an **"Entrar"** button (Google);
  logged in → an **avatar + menu** (with "Sair"). Nothing else in the app changes.
- **Logged out:** the app behaves exactly as today (ephemeral, nothing saved to the cloud).
- **On login:** create/update `users/{uid}`; **adopt this session's in-memory attempts**
  (write them to `attempts` and update `phraseStats`) as a one-time merge. Persisting anon
  progress across reloads before login is out of scope (phase 5).
- **Logged in:** every recognition score writes an `attempt` and updates `phraseStats`
  immediately.

The `ListeningSpeakingApp` orchestrator's `saveEvaluation` gains a persistence side-effect
when a user is present; its in-memory `evaluations` state is unchanged so the anonymous
path is untouched.

## 4. Progress view — route `/progress` (logged-in only)

A new route rendering the logged-in user's evolution, reusing Sub-project A's visual
language (black & white, the spine/nodes, the progress bar):

- Completion % (reuses `ProgressBar`).
- The 36-phrase grid with each node showing its best score / done-state (reuses the spine
  node visuals).
- Average of best scores.
- Simple streak (consecutive days with at least one practice).
- A **"Compartilhar meu progresso"** action that generates/reveals the public link and
  offers to revoke it.

If accessed while logged out, the route redirects to the practice view `/`; sign-in stays
available from the TopBar.

## 5. Public share link — route `/s/:slug`

- Client-rendered, **no login required to view**. Reads `shares/{slug}` and renders a
  read-only version of the progress view from the stored `snapshot`.
- **Generate:** creates `shares/{slug}` with a random, unguessable slug; sets `shareSlug` +
  `shareEnabled` on the user doc. **Revoke:** deletes `shares/{slug}` and clears the user
  fields.
- **Privacy:** aggregates + Google display name/avatar only — never transcripts, never raw
  attempts.
- If a slug is missing/revoked, the page shows a friendly "link not found / revoked" state.
- Rich OG link previews are not possible on a client-rendered page; deferred (a small
  serverless OG function is the future path).

## 6. Firestore Security Rules

```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
  match /{sub=**} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
match /shares/{slug} {
  allow read: if true;                                   // public read
  allow create, update, delete:
    if request.auth != null && request.resource.data.uid == request.auth.uid;
}
```

Chosen approach: **snapshot the aggregates into `shares/{slug}`** at share time. The public
page never reads another user's private collections, so the rules stay trivial (private user
tree, public share doc) and no internal structure leaks. This is why `shares/{slug}` carries
the `snapshot` field rather than the public page reading `phraseStats` directly.

Also enforced in rules where practical: attempt writes belong to the acting user; scores are
bounded 0–100; a share `snapshot` never contains a `transcript` field.

## 7. Testing & conventions

- Vitest + Testing Library (as in A; `afterEach(cleanup)` still required). Firebase is
  mocked at the hook boundary for component tests; Security Rules are tested with
  `@firebase/rules-unit-testing` against the Firestore emulator.
- Coverage targets: auth states (logged out / logged in / loading); attempt → `phraseStats`
  rollup math; share create/revoke; public page rendering from a snapshot; rules (owner can
  read/write own data, others cannot; anyone can read a share; no one can forge a share for
  another uid).
- `npx tsc --noEmit` clean, `npx vitest run` green, `npx eslint src` 0 problems.
- Follows `CLAUDE.md`: snakeCase dirs under `src`; component = CamelCase folder with only
  `index.tsx`; `export function` (never default); `id` attribute on every component; `@/`
  imports only; shadcn components where available; no arbitrary Tailwind values; the minimal
  black & white palette is unchanged (the documented `green` success accent from A remains
  the only exception).

## 8. Out of scope (future phases)

- Anonymous progress persistence across reloads (localStorage) and full anon→account merge.
- Rich OG previews for shared links (serverless function).
- Opt-in transcript sharing.
- Data-rights UX beyond revoke (full account/data deletion), rate limiting.

## 9. Dependency setup (operational, done at implementation time)

Requires a Firebase project (Spark plan): enable Google as an Auth provider, add
`geldopc.github.io` and `localhost` to authorized domains, create the Firestore database,
and publish the Security Rules above. The web config values go into the client (committed or
via build-time env — decided in the plan).
