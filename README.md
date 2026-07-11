# Listening & Speaking — Friends

App de prática de listening e speaking a partir de uma cena de *Friends*
(temporada 5, "Joey descobre o segredo"). Escute cada frase, repita em voz
alta e receba um percentual de acerto na sua pronúncia.

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
- **Speaking**: o botão "Gravar / Repetir" usa a Web Speech API
  (`SpeechRecognition`/`webkitSpeechRecognition`, `en-US`) para transcrever a
  fala do usuário e comparar com o texto original via distância de
  Levenshtein, mostrando um percentual de acerto (0–100%).

Ver [AUDIO_CUTS.md](./AUDIO_CUTS.md) para os intervalos de origem de cada
áudio e como os cortes foram feitos e validados.

## Estrutura

```
src/
  components/
    ListeningSpeakingApp/   # página principal: lista de frases + seletor de velocidade
    PhraseCard/             # card individual: play, gravação, avaliação
    ui/                     # componentes shadcn (button, card, select)
  lib/
    phrases.ts              # roteiro das 36 frases (texto, áudio, dica de pronúncia)
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
