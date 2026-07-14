# myPronunciationClass

**English** · [Português](README.md)

A listening and speaking practice app built around a *Friends* scene
(season 5, "The One Where Everyone Finds Out"). The dialogue is presented as a
continuous script: listen to each line, repeat it aloud, and get an accuracy
score on your pronunciation. Choose your difficulty level (Easy / Medium /
Hard) and toggle between light and dark themes.

Google login is optional: without it, progress stays in memory for the session;
logged in, every attempt is persisted in Firebase and you can review your
history at `/progress` or share a public read-only results link.

Stack: [TanStack Start](https://tanstack.com/start) + React + TypeScript +
[shadcn/ui](https://ui.shadcn.com) + Firebase (Auth + Firestore).

## Running locally

```bash
npm install
npm run dev
```

The server starts on a free port (defaults to 3000 if available).

## Firebase setup

Google login, progress persistence, and link sharing require your own Firebase
project. Do this once before running login/persistence locally or deploying:

1. Create a project in the [Firebase Console](https://console.firebase.google.com)
   (the free Spark plan is enough).
2. **Authentication** → enable the **Google** sign-in provider.
3. **Authentication** → **Settings** → **Authorized domains** → add
   `geldopc.github.io` and `localhost`.
4. **Firestore Database** → create a database in production mode.
5. Deploy the security rules:
   ```bash
   npx firebase deploy --only firestore:rules --project <your-project-id>
   ```
   (or paste the contents of [`firestore.rules`](./firestore.rules) directly
   in the console). Optionally, run the rules tests locally with
   `npm run test:rules` (requires Firebase CLI + Java emulator).
6. Copy `.env.example` to `.env` and fill in the `VITE_FIREBASE_*` values from
   your web app config (Project settings → Your apps → SDK setup and
   configuration).
7. For GitHub Pages deploys, add the same six `VITE_FIREBASE_*` keys as
   **Variables** in GitHub Actions (Settings → Secrets and variables →
   Actions → Variables) — the deploy workflow injects them into the build.

## How it works

- **Listening**: each card plays the corresponding local audio file
  (`public/audios/frase1.mp3`..`frase36.mp3`) with a global speed control
  (0.5x–1.5x) via `<audio>.playbackRate`.
- **Pronunciation hints**: each phrase shows common reductions and connections
  in spoken English (e.g. "you're" → /jɚ/).
- **Speaking**: the "Repeat" button uses the Web Speech API
  (`SpeechRecognition`/`webkitSpeechRecognition`, `en-US`) to transcribe
  the user's speech and compare it to the original text via Levenshtein
  distance, showing an accuracy score (0–100%); scores ≥80% are highlighted
  in green.
- **Difficulty**: Easy shows text + hint; Medium hides the hint (tap to peek);
  Hard hides text and hint until after you record.
- **Theme**: light/dark toggle in the top bar, saved to `localStorage`.
- **Login (optional)**: Google via popup. Without login the app works normally
  (ephemeral progress). Logged in, every attempt is saved to Firestore.
- **Progress**: `/progress` shows full history, best score per phrase, streak,
  and completion percentage.
- **Sharing**: generate a public `/s/:slug` link that displays a snapshot of
  your results — aggregates only, no transcripts.

See [AUDIO_CUTS.md](./AUDIO_CUTS.md) for the source timestamps of each audio
file and how the cuts were made and validated.

## Structure

```
src/
  components/
    ListeningSpeakingApp/   # shell: session state + orchestration
    TopBar/                 # logo + difficulty + speed + focus + theme + auth
      AuthControl/          # login button / avatar menu
      DifficultyToggle/
      SpeedControl/
      ThemeToggle/
    ProgressBar/            # thin bar + "n / 36" counter
    PhraseList/             # continuous list (spine) + focus mode; SpineNode
    PhraseCard/             # card: difficulty-gated reveal, actions, ScoreReveal
    ProgressStats/          # presentational stats (shared by /progress and /s/:slug)
    ProgressView/           # logged-in user dashboard
    ShareView/              # public read-only snapshot view
    ShareControl/           # share link create / revoke controls
  providers/
    Auth/                   # AuthProvider + useAuth (Firebase Auth)
    Theme/                  # ThemeProvider + useTheme
  hooks/
    useAudioPlayer/         # audio playback + playbackRate
    useSpeechRecognition/   # speech recognition lifecycle
    useProgress/            # persistence + rollups for the logged-in user
    useShareLink/           # public share link create / revoke state
  lib/
    phrases.ts              # the 36-phrase script (text, audio, hint, speaker)
    difficulty.ts           # reveal rules per difficulty level
    text-similarity.ts      # text normalisation + Levenshtein distance
    firebase.ts             # initialises Firebase app; exports auth, db
    firebaseConfig.ts       # config from import.meta.env.VITE_FIREBASE_*
    progress-model.ts       # domain types (Attempt, PhraseStat, Rollups, Share…)
    rollups.ts              # pure rollup + streak maths
    attempts.ts             # Firestore access for attempts and phraseStats
    shares.ts               # share create / read / revoke + slug generation
  routes/
    index.tsx               # "/" route (TanStack Router, file-based)
    progress.tsx            # "/progress" route (authenticated)
    s.$slug.tsx             # "/s/:slug" public route
  types/
    speech-recognition.d.ts # minimal Web Speech API type declarations
public/
  audios/                   # the 36 trimmed .mp3 files
  favicon.svg               # app icon (circle + sound wave)
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run typecheck` — type checking
- `npm run lint` — eslint
- `npm run test:rules` — test Firestore security rules (requires Firebase emulator)
