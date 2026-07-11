# myPronunciationClass

App de prática de listening e speaking a partir de uma cena de *Friends*
(temporada 5, "Joey descobre o segredo"). O diálogo é apresentado como um
roteiro contínuo: escute cada fala, repita em voz alta e receba um percentual
de acerto na sua pronúncia. Você escolhe o nível (Fácil / Médio / Difícil), que
controla o quanto o card revela antes da sua tentativa, e pode alternar entre
tema claro e escuro.

Stack: [TanStack Start](https://tanstack.com/start) + React + TypeScript +
[shadcn/ui](https://ui.shadcn.com) (gerado com `npx shadcn@latest init`).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000.

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
  dica"); Difícil esconde texto e dica até você gravar. A tentativa sempre
  revela tudo.
- **Tema**: alternância claro/escuro no topo, com a preferência salva em
  `localStorage` (a única coisa persistida — o progresso da prática é efêmero).

Ver [AUDIO_CUTS.md](./AUDIO_CUTS.md) para os intervalos de origem de cada
áudio e como os cortes foram feitos e validados.

## Estrutura

```
src/
  components/
    ListeningSpeakingApp/   # shell: estado da sessão + orquestração
    TopBar/                 # wordmark + dificuldade + velocidade + foco + tema
    ProgressBar/            # barra fina + contador "n / 36"
    PhraseList/             # lista contínua (spine) + modo foco; SpineNode
    PhraseCard/             # card: revela por dificuldade, ações, ScoreReveal
  providers/
    Theme/                  # ThemeProvider + useTheme (claro/escuro)
  hooks/
    useAudioPlayer/         # reprodução de áudio + playbackRate
    useSpeechRecognition/   # ciclo de vida do reconhecimento de fala
  lib/
    phrases.ts              # roteiro das 36 frases (texto, áudio, dica, speaker)
    difficulty.ts           # regras de revelação por nível
    text-similarity.ts      # normalização de texto + distância de Levenshtein
  routes/
    index.tsx               # rota "/" (TanStack Router, file-based)
  types/
    speech-recognition.d.ts # tipagem mínima da Web Speech API
public/
  audios/                  # os 36 arquivos .mp3 cortados
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run typecheck` — checagem de tipos
- `npm run lint` — eslint
