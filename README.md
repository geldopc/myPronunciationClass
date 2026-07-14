# myPronunciationClass

[English](README.en.md) · **Português**

App de prática de listening e speaking a partir de uma cena de *Friends*
(temporada 5, "Joey descobre o segredo"). O diálogo é apresentado como um
roteiro contínuo: escute cada fala, repita em voz alta e receba um percentual
de acerto na sua pronúncia. Escolha o nível de dificuldade (Fácil / Médio /
Difícil) e alterne entre tema claro e escuro.

Login com Google é opcional: sem login o progresso fica em memória; ao entrar,
cada tentativa é persistida no Firebase e você pode acessar seu histórico em
`/progress` ou gerar um link público para compartilhar seus resultados.

Stack: [TanStack Start](https://tanstack.com/start) + React + TypeScript +
[shadcn/ui](https://ui.shadcn.com) + Firebase (Auth + Firestore).

## Rodando localmente

```bash
npm install
npm run dev
```

O servidor sobe em uma porta livre (por padrão 3000 se disponível).

## Firebase setup

Login com Google, persistência de progresso e compartilhamento de link
dependem de um projeto Firebase próprio. Antes de rodar login/persistência
localmente ou fazer deploy, faça uma vez:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
   (plano Spark/gratuito é suficiente).
2. **Authentication** → habilite o provedor de login **Google**.
3. **Authentication** → **Settings** → **Authorized domains** → adicione
   `geldopc.github.io` e `localhost`.
4. **Firestore Database** → crie um banco em modo produção.
5. Publique as regras de segurança:
   ```bash
   npx firebase deploy --only firestore:rules --project <seu-project-id>
   ```
   (ou cole o conteúdo de [`firestore.rules`](./firestore.rules) direto no
   console). Opcionalmente, rode os testes das regras localmente com
   `npm run test:rules` (requer Firebase CLI + emulador Java).
6. Copie `.env.example` para `.env` e preencha os valores `VITE_FIREBASE_*`
   com a config do app web (Project settings → Your apps → SDK setup and
   configuration).
7. Para deploys no GitHub Pages, configure as mesmas seis chaves
   `VITE_FIREBASE_*` como **Variables** do GitHub Actions (Settings → Secrets
   and variables → Actions → Variables) — o workflow de deploy injeta esses
   valores no build.

## Como funciona

- **Listening**: cada card toca o áudio local correspondente
  (`public/audios/frase1.mp3`..`frase36.mp3`) com controle global de
  velocidade (0.5x–1.5x) via `<audio>.playbackRate`.
- **Dica de pronúncia**: cada frase mostra reduções e conexões comuns do
  inglês falado (ex.: "you're" → /jɚ/).
- **Speaking**: o botão "Repetir" usa a Web Speech API
  (`SpeechRecognition`/`webkitSpeechRecognition`, `en-US`) para transcrever a
  fala do usuário e comparar com o texto original via distância de
  Levenshtein, mostrando um percentual de acerto (0–100%); acertos ≥80% ganham
  destaque em verde.
- **Dificuldade**: Fácil mostra texto + dica; Médio esconde a dica (com "Ver
  dica"); Difícil esconde texto e dica até você gravar.
- **Tema**: alternância claro/escuro no topo, salvo em `localStorage`.
- **Login (opcional)**: Google via popup. Sem login o app funciona normalmente
  (progresso efêmero). Com login, cada tentativa é salva no Firestore.
- **Progresso**: `/progress` mostra histórico completo, melhor score por frase,
  streak e percentual de conclusão.
- **Compartilhamento**: gere um link público `/s/:slug` que exibe um snapshot
  dos seus resultados — sem expor transcrições, apenas agregados.

Ver [AUDIO_CUTS.md](./AUDIO_CUTS.md) para os intervalos de origem de cada
áudio e como os cortes foram feitos e validados.

## Estrutura

```
src/
  components/
    ListeningSpeakingApp/   # shell: estado da sessão + orquestração
    TopBar/                 # logo + dificuldade + velocidade + foco + tema + auth
      AuthControl/          # botão login / menu avatar
      DifficultyToggle/
      SpeedControl/
      ThemeToggle/
    ProgressBar/            # barra fina + contador "n / 36"
    PhraseList/             # lista contínua (spine) + modo foco; SpineNode
    PhraseCard/             # card: revela por dificuldade, ações, ScoreReveal
    ProgressStats/          # stats apresentacionais (compartilhado por /progress e /s/:slug)
    ProgressView/           # dashboard do usuário logado
    ShareView/              # view pública read-only de um snapshot
    ShareControl/           # controles de criação / revogação de link
  providers/
    Auth/                   # AuthProvider + useAuth (Firebase Auth)
    Theme/                  # ThemeProvider + useTheme
  hooks/
    useAudioPlayer/         # reprodução de áudio + playbackRate
    useSpeechRecognition/   # ciclo de vida do reconhecimento de fala
    useProgress/            # persistência + rollups para o usuário logado
    useShareLink/           # criação / revogação de link público
  lib/
    phrases.ts              # roteiro das 36 frases (texto, áudio, dica, speaker)
    difficulty.ts           # regras de revelação por nível
    text-similarity.ts      # normalização de texto + distância de Levenshtein
    firebase.ts             # inicializa o app Firebase; exporta auth, db
    firebaseConfig.ts       # config lida de import.meta.env.VITE_FIREBASE_*
    progress-model.ts       # tipos de domínio (Attempt, PhraseStat, Rollups, Share…)
    rollups.ts              # cálculo puro de rollups e streak
    attempts.ts             # acesso Firestore para tentativas e phraseStats
    shares.ts               # criação / leitura / revogação de shares + slug
  routes/
    index.tsx               # rota "/" (TanStack Router, file-based)
    progress.tsx            # rota "/progress" (autenticado)
    s.$slug.tsx             # rota "/s/:slug" (pública)
  types/
    speech-recognition.d.ts # tipagem mínima da Web Speech API
public/
  audios/                   # os 36 arquivos .mp3 cortados
  favicon.svg               # ícone do app (círculo + onda sonora)
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run typecheck` — checagem de tipos
- `npm run lint` — eslint
- `npm run test:rules` — testa as regras Firestore (requer Firebase emulador)
