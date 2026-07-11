# Accounts, Progress & Sharing — Planning (Sub-project B)

**Date:** 2026-07-11
**Status:** Planning only — NOT scheduled for implementation yet.
**Origin:** User asked (`/brainstorming`) to "levantar um planejamento" for optional social
login, activity history + user evolution, and a shareable public results link. Login must
**not** be required to use the app.

This is a planning document, not an implementation spec. When B is greenlit, it should go
through its own brainstorming → spec → plan cycle. This captures requirements, the
architecture options, a recommended approach, the data model, the share design, privacy
concerns, and a phased rollout, so the decision can be made with eyes open.

---

## 1. Requirements

1. **Optional social login.** Google (and optionally GitHub) OAuth. Anonymous use stays
   fully functional; login only *adds* persistence + sharing.
2. **Activity history.** Every practice attempt (phrase, difficulty, score, transcript,
   timestamp) is stored for logged-in users.
3. **User evolution.** Aggregate progress over time — best score per phrase, scene
   completion %, average score trend, streaks, per-phrase mastery.
4. **Shareable public link.** A user can generate a link that shows their results; the
   link is **freely viewable** (no login to view), read-only.
5. **Anonymous → account migration.** In-session (A) progress isn't persisted today; when
   B lands, an anonymous session's progress should be adoptable on first login.

---

## 2. Architecture options

The app is **TanStack Start** — it has SSR + server functions (`createServerFn`), so a
backend can live in the same codebase without a separate service. Three realistic paths:

### Option 1 — TanStack Start server functions + Postgres + Better Auth (RECOMMENDED)
- Auth: **Better Auth** (framework-agnostic, first-class social providers, session cookies,
  works with Start's server handlers). Alternatively Auth.js.
- DB: **Postgres** (Neon/Supabase/Railway) via **Drizzle ORM** (typed, light, migrations).
- Data access: server functions only; the browser never holds DB creds.
- **Why:** one codebase, typed end-to-end, cheapest to operate, keeps the "no login
  required" path trivial (server functions just no-op persistence for anon users).

### Option 2 — Supabase (Postgres + Auth + RLS) as BaaS
- Supabase Auth (social providers built in) + Postgres + Row-Level Security.
- Faster to stand up; RLS gives public-read for shared results cleanly.
- **Trade-off:** couples the app to Supabase; some logic lives in SQL/policies rather than
  typed TS. Good if you want the least backend code.

### Option 3 — Clerk (auth) + separate DB
- Clerk handles all auth UX/social. Pair with any Postgres.
- **Trade-off:** great auth DX, but another vendor + cost, and overkill for a personal app.

**Recommendation: Option 1** for control, cost, and type-safety; **Option 2** if you'd
rather ship fast and lean on a BaaS. Decide at B's spec time.

---

## 3. Data model (provider-agnostic)

```
User        id, provider, providerUserId, displayName, avatarUrl, createdAt
Attempt     id, userId, phraseId, difficulty, score, transcript, createdAt
PhraseStat  userId, phraseId, bestScore, attemptsCount, lastPracticedAt   (derived/materialized)
ShareLink   id, userId, slug (public), createdAt, revokedAt?, visibility='public'
```

- `Attempt` is the append-only event log (history).
- `PhraseStat` is the rollup powering "evolution" (best score, mastery, completion %).
- `ShareLink.slug` is a random unguessable id; a public read-only page renders that user's
  rollups (never raw transcripts unless the user opts in).

---

## 4. Share design

- Route: `/s/:slug` (public, SSR, no auth). Renders a read-only "results" view:
  scene-completion %, per-phrase best scores, average trend, streak. Reuses the same
  visual language as the app.
- Privacy: share exposes **aggregates by default**; transcripts are private unless the user
  explicitly includes them. Links are revocable. No PII beyond chosen display name/avatar.
- SEO/OG: server-rendered title + summary so a shared link previews nicely.

---

## 5. Anonymous & migration

- Anonymous users: the app works exactly as in A. Optionally, B may add opt-in localStorage
  so anon progress survives reloads even before login (decide at spec time — A is
  deliberately stateless).
- On first login: adopt the current in-memory/localStorage session into the user's
  `Attempt`/`PhraseStat` rows (one-time merge).

---

## 6. Privacy & security notes

- OAuth tokens/secrets live server-side only (env vars, never in the client bundle).
- Server functions authorize every write to the acting user; never trust a client-supplied userId.
- Public share pages must query by `slug` and return only shareable fields.
- Consider rate-limiting share-link creation and attempt writes.
- Add a "delete my data / revoke link" path (basic data-rights hygiene).

---

## 7. Dependencies on Sub-project A

B builds directly on A's model:
- A's `Attempt` shape (`phraseId`, `difficulty`, `score`, `transcript`) is already the exact
  row B persists — designing A this way (even though A is stateless) means B's history is a
  drop-in, not a redesign.
- The progress UI (spine done-states, `n/36`, score reveal) becomes the logged-in dashboard
  and the public share view with minimal rework.

---

## 8. Suggested phased rollout (when B is greenlit)

1. **Phase 1 — Auth shell:** social login (Google), session, "no login required" preserved.
2. **Phase 2 — Persistence:** write `Attempt`, materialize `PhraseStat`; logged-in progress
   survives reloads and devices.
3. **Phase 3 — Evolution UI:** history + trend + streak dashboard for the logged-in user.
4. **Phase 4 — Sharing:** `ShareLink` + public `/s/:slug` read-only results page.
5. **Phase 5 — Polish:** anon→account migration, data-rights (delete/revoke), rate limits.

Each phase is independently shippable and independently valuable.
