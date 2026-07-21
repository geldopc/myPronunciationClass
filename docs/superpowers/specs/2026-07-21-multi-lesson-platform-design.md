# Multi-Lesson Platform Design

## Goal

Transform myPronunciationClass from a single-lesson app into a platform that supports multiple YouTube-based lessons, with an admin system for creating and editing content, a lesson selector for students, and per-lesson progress tracking.

## Architecture

Pure Firestore data layer. All lesson and phrase content moves from the static `phrases.ts` file into Firestore collections. The app loads lessons and phrases at runtime. Admin edits are immediately visible to students without a redeploy. The existing Firebase Auth (Google sign-in) and Firestore setup are extended — no new backend or Cloud Functions required.

`audioSrc` is removed from the `Phrase` type and all related code. The app uses only YouTube video segments (startTime / endTime) for playback.

## Tech Stack

React 19, TypeScript, Tailwind v4, TanStack Router (SPA), Firebase Auth, Firestore, shadcn/ui (primary component source), existing `useYouTubePlayer` hook.

## Global Constraints

- No backend / Cloud Functions — all logic runs client-side against Firestore
- `audioSrc` field is removed entirely from Phrase type and all usages
- `Phrase.id` changes from `number` to `string` (Firestore doc ID)
- `SOURCE_VIDEO_ID` constant in `phrases.ts` is eliminated; `youtubeId` comes from the lesson document
- Firestore Security Rules enforce all access control — client-side role checks alone are never the sole gate
- The existing Friends S5E14 lesson is preserved as the first lesson via seed migration
- Mobile-first responsive design; admin editor is optimised for desktop/tablet

---

## Sub-project A — Firestore Foundation

**Delivers:** migrated data model, updated TypeScript types, new data hooks, removal of audio references. Everything else depends on this.

### Firestore Schema

```
lessons/{lessonId}
  title: string
  youtubeId: string
  thumbnailUrl: string        // fetched from YouTube oEmbed on creation, stored once
  createdAt: Timestamp
  createdBy: string           // uid of creating admin

lessons/{lessonId}/phrases/{phraseId}
  order: number               // display order (sort by startTime ascending)
  text: string
  speaker: string
  pronunciationHint: string
  startTime: number
  endTime: number

admins/{email}
  status: "invited" | "active"
  invitedBy: string           // uid of admin who invited
  invitedAt: Timestamp
  activatedAt: Timestamp | null

users/{uid}/attempts/{attemptId}
  lessonId: string            // NEW — scopes attempt to a lesson
  phraseId: string            // was number, now Firestore doc ID string
  difficulty: string
  score: number
  transcript: string
  createdAt: Timestamp

users/{uid}/phraseStats/{lessonId_phraseId}   // composite key
  lessonId: string
  phraseId: string
  bestScore: number
  attemptsCount: number
  lastPracticedAt: Timestamp
```

### TypeScript Types (replaces current phrases.ts exports)

```typescript
// src/lib/lessons.ts
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
```

### New Hooks

**`useLessons()`** — loads all lesson documents from Firestore, returns `{ lessons, loading }`.

**`useLesson(lessonId)`** — loads a single lesson + its phrases subcollection ordered by `order`, returns `{ lesson, phrases, loading }`.

**`useProgress(lessonId?)`** — updated to accept optional `lessonId`:
- With `lessonId`: filters phraseStats to that lesson, computes rollups scoped to the lesson
- Without `lessonId`: aggregates all phraseStats across all lessons for global rollups

### Firestore Security Rules

```javascript
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

      // The invited person can activate only their own invite
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

### Seed Migration Script

A one-time Node.js script (`scripts/seed.ts`) that:
1. Creates the Friends S5E14 lesson document with `lessonId: "friends-s5e14"`, fetching thumbnail from YouTube oEmbed
2. Writes all 36 phrases as subcollection documents (without `audioSrc`)
3. Creates `admins/geldopc@gmail.com` with `status: "active"`, `invitedBy: "system"`, `activatedAt: now`
4. For each existing user, re-writes `phraseStats` with composite key `friends-s5e14_{phraseId}` and adds `lessonId: "friends-s5e14"` to existing attempts

The script is idempotent — safe to run more than once.

### Files Changed in Sub-project A

- **Delete:** `src/lib/phrases.ts` (replaced by Firestore + `src/lib/lessons.ts`)
- **Delete:** `src/lib/pronunciationTips.ts` (tips stored as `pronunciationHint` in Firestore)
- **Create:** `src/lib/lessons.ts` — Lesson and Phrase types + Firestore CRUD helpers
- **Create:** `src/hooks/useLessons/index.ts`
- **Create:** `src/hooks/useLesson/index.ts`
- **Modify:** `src/hooks/useProgress/index.ts` — add `lessonId?` param
- **Modify:** `src/lib/attempts.ts` — add `lessonId` to recordAttempt, update phraseStats key
- **Modify:** `src/lib/progress-model.ts` — update Attempt and PhraseStat types
- **Modify:** `src/components/ListeningSpeakingApp/index.tsx` — consume `useLesson` instead of static phrases
- **Modify:** `src/components/VideoPlayer/index.tsx` — Phrase.id is now string
- **Modify:** `src/components/PhraseCard/index.tsx` — Phrase.id is now string, remove audioSrc
- **Create:** `scripts/seed.ts`
- **Create:** `firestore.rules`

---

## Sub-project B — Admin System + Clip Editor

**Delivers:** role management, admin invitation, lesson CRUD, visual clip editor. Requires Sub-project A.

### Admin Hook

**`useAdmin()`** — on mount, reads `admins/{user.email}` from Firestore:
- If `status: "invited"`: writes `status: "active"` + `activatedAt: now`, returns `isAdmin: true`
- If `status: "active"`: returns `isAdmin: true`
- Otherwise: returns `isAdmin: false`
- Returns `{ isAdmin, loading }`

### Routes

```
/admin                          — dashboard
/admin/lessons/new              — add lesson form
/admin/lessons/{lessonId}       — clip editor
```

All `/admin/*` routes wrapped in `<AdminGuard>`: renders children only when `isAdmin === true`; shows spinner while loading; redirects to `/` if not admin.

### Dashboard `/admin`

**Lessons panel** — table: thumbnail, title, phrase count, "Edit clips" button. "New lesson" CTA.

**Team panel** — table: email, status badge (invited / active), invited by, date. "Invite admin" form: email input + submit. Writes `admins/{email}` with `status: "invited"`. Confirmation message: "Invite saved. They'll be promoted when they log in with that Google account." Revoke button on each row (disabled for own email).

### Add Lesson `/admin/lessons/new`

Fields: title (text), YouTube URL or ID (parser extracts ID from full URL or bare ID).

On submit:
1. Fetch `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={id}&format=json`
2. Extract `thumbnail_url` from response
3. Write lesson document to Firestore
4. Redirect to `/admin/lessons/{newLessonId}`

### Clip Editor `/admin/lessons/{lessonId}`

#### Layout (desktop-first, functional on tablet)

```
┌─────────────────────────────────────────────────┐
│  ← Back to lessons    Friends S5E14             │
├─────────────────────────────────────────────────┤
│           YouTube Player (16:9)                 │
│  ◀ 0:12.3  [▶ Play / ⏸ Pause]  1:23.5 / 3:12  │
│  [✂ Marcar início]      [✂ Marcar fim]          │
├────────────────────────┬────────────────────────┤
│  Timeline visual       │  Formulário            │
│  0s ▓1▓░▓2▓▓░▓3░▓4▓ T │  Ordem:  [3]           │
│       ↑ segmento ativo │  Texto:  [___________] │
│                        │  Speaker:[___________] │
│                        │  Dica:   [___________] │
│                        │  Início: [12.300    ]  │
│                        │  Fim:    [15.800    ]  │
│                        │  [▶ Pré-visualizar]    │
│                        │  [💾 Salvar] [🗑 Excluir]│
└────────────────────────┴────────────────────────┘
```

#### Timeline

SVG component, horizontal axis 0 → video duration. Each saved phrase is a colored rectangle, width proportional to (endTime - startTime), labeled with order number. Active/selected phrase has highlighted border. Pending new phrase is a semi-transparent preview segment that updates in real-time as times are marked. Clicking a segment loads the phrase into the form and seeks the player. Warning shown if times overlap an existing clip.

#### Mark Start / Mark End

- "Marcar início": captures `player.getCurrentTime()` → sets startTime field
- "Marcar fim": captures `player.getCurrentTime()` → sets endTime field
- Fields also accept manual numeric input
- "Pré-visualizar": calls `playSegment(startTime, endTime)` from `useYouTubePlayer`

#### Save / Delete

- Save: upserts phrase document in `lessons/{lessonId}/phrases/{phraseId}`
- New phrase order = count of existing phrases + 1
- Delete: removes document; remaining phrases are not re-indexed (order gaps are acceptable)
- Phrases are always displayed sorted by startTime ascending

### Files Changed in Sub-project B

- **Create:** `src/hooks/useAdmin/index.ts`
- **Create:** `src/components/AdminGuard/index.tsx`
- **Create:** `src/routes/admin/index.tsx` — dashboard
- **Create:** `src/routes/admin/lessons/new.tsx`
- **Create:** `src/routes/admin/lessons/$lessonId.tsx` — clip editor
- **Create:** `src/components/ClipEditor/index.tsx`
- **Create:** `src/components/ClipEditor/Timeline.tsx`
- **Modify:** `src/router.tsx` — add admin routes

---

## Sub-project C — Lesson Selector (Student-facing)

**Delivers:** lesson gallery at `/lessons`, per-lesson practice route, TopBar lesson switcher. Requires Sub-project A.

### Routes

```
/                       — redirects to /lessons/{storedLessonId} or /lessons
/lessons                — lesson gallery
/lessons/{lessonId}     — practice session for that lesson
```

Current `/` route becomes `/lessons/{lessonId}`. The root `/` handles the redirect.

### Lesson Gallery `/lessons`

Grid of lesson cards (2 columns mobile, 3+ desktop):
- Thumbnail, title, phrase count
- Completion % and last practiced date (from useProgress, 0% if not logged in)
- Clicking a card: sets `localStorage.lessonId`, navigates to `/lessons/{lessonId}`

### Practice Route `/lessons/{lessonId}`

Renders `ListeningSpeakingApp` with lesson loaded via `useLesson(lessonId)`. Shows loading skeleton while Firestore data loads. Redirects to `/lessons` if lessonId not found.

### TopBar Lesson Switcher

Visible only when 2+ lessons exist (from `useLessons()` count). Shows current lesson title as a clickable button with chevron. Opens a dropdown listing all lessons with completion %. Selecting a lesson updates localStorage and navigates. Single lesson: TopBar unchanged.

### Lesson Persistence

`localStorage.setItem("lessonId", lessonId)` on every selection. Root `/` redirect reads this value. Defaults to the first lesson if nothing is stored.

### Files Changed in Sub-project C

- **Create:** `src/routes/lessons/index.tsx` — gallery
- **Create:** `src/routes/lessons/$lessonId.tsx` — practice session
- **Modify:** `src/routes/index.tsx` — redirect logic
- **Create:** `src/components/LessonCard/index.tsx`
- **Modify:** `src/components/TopBar/index.tsx` — lesson switcher
- **Modify:** `src/router.tsx`

---

## Sub-project D — Progress Per Lesson

**Delivers:** `useProgress(lessonId?)` with per-lesson rollups, expanded `/progress` page. Requires Sub-project A. Can be developed in parallel with Sub-project C.

### Rollups Type Extension

```typescript
export type LessonRollup = {
  lessonId: string
  completion: number
  average: number
  lastPracticedAt: number | null
}

export type Rollups = {
  completion: number
  average: number
  streak: number
  bestScoreByPhrase: Record<string, number>
  byLesson: LessonRollup[]    // NEW
}
```

### useProgress(lessonId?) Changes

- Without `lessonId`: loads all phraseStats, computes global rollups + `byLesson` array
- With `lessonId`: filters to `phraseStats` where key starts with `{lessonId}_`, computes lesson-scoped rollups
- Streak always global (any lesson counts toward calendar days)

### Progress Page `/progress`

**Global header** (current, unchanged): streak, overall average, total completion.

**Per-lesson section** (new): one card per lesson the user has practiced, ordered by last practiced (most recent first). Card shows thumbnail, title, completion bar, average score, last practiced date, "Ver detalhes" button. "Ver detalhes" shows the existing phrase-level bar chart scoped to that lesson. Lessons with 0% completion shown at the bottom with "Start practicing" CTA.

### Files Changed in Sub-project D

- **Modify:** `src/lib/progress-model.ts` — add LessonRollup, extend Rollups
- **Modify:** `src/hooks/useProgress/index.ts` — add lessonId? param, compute byLesson
- **Modify:** `src/lib/rollups.ts` — update computeRollups
- **Modify:** `src/components/ProgressView/index.tsx` — per-lesson section
- **Modify:** `src/components/ProgressDashboard/index.tsx` — lesson breakdown cards

---

## Implementation Order

| Order | Sub-project | Can run in parallel with |
|-------|-------------|--------------------------|
| 1st | A — Firestore Foundation | — |
| 2nd | B — Admin + Clip Editor | C, D |
| 2nd | C — Lesson Selector | B, D |
| 2nd | D — Progress Per Lesson | B, C |

## Conscious Scope Decisions

- No email notification for admin invites — admin shares out-of-band; system activates on next login
- No lesson draft/published status — lessons are visible immediately when created
- No audio files — online-only via YouTube player
- Lesson thumbnail fetched and stored once at creation; no automatic refresh
- Clip editor not optimised for mobile — admin work expected on desktop/tablet
- `pronunciationTips.ts` merged into `pronunciationHint` field per phrase during migration and deleted
- Delete gaps in phrase `order` are acceptable; display always uses startTime sort
