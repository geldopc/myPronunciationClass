# Cortes de áudio (v3 — verificados por transcrição do próprio clipe)

Origem: `Friends Joey Finds Out Season 5 Clip TBS.mp3` (00:00.000–03:22.998).

## Como os cortes foram feitos e validados

1. Detecção de silêncio (`ffmpeg silencedetect`, -24dB/0.12s) + transcrição
   por timestamp de palavra (`whisper-cli`) para posicionar os cortes em
   pausas reais, sem quebrar palavras.
2. **Cada arquivo final foi retranscrito individualmente** (modelo
   `small.en`, mais preciso) para confirmar que o áudio realmente contém a
   fala do texto associado — não apenas o trecho de origem como um todo.
   Essa validação pegou 6 clipes da v2 que continham só reação da plateia
   ("(audience laughing)", "(scoffs)", "(sighs)") sem nenhuma fala, e outros
   que tinham o texto deslocado em relação ao áudio. Todos foram corrigidos
   ou mesclados ao clipe vizinho correto.
3. Clipes de uma palavra só (\"Hi.\", \"Uh, no.\", \"Hey. Hey.\") foram
   fundidos ao clipe adjacente — não agregam nada isolados para o treino de
   listening/speaking. O resultado é uma progressão de dificuldade: de
   ~1.8s (frase mais curta) a ~9.5s (frase mais longa), sem nenhum clipe
   trivial no meio do caminho.
4. O trecho de aplausos/vaias contínuos antes de "Joey, can I talk to you
   for a second?" (frase21) foi aparado — sobrava ~17s de plateia sem
   nenhuma fala antes da frase.

Resultado: **36 arquivos**, cobrindo de `00:00.000` a `03:10.337`. O trecho
final (música de encerramento sem fala) foi descartado.

| Arquivo | Início | Fim | Duração |
| --- | ---: | ---: | ---: |
| frase1.mp3 | 00:00.000 | 00:08.395 | 8.39s |
| frase2.mp3 | 00:08.395 | 00:10.823 | 2.43s |
| frase3.mp3 | 00:10.823 | 00:13.657 | 2.83s |
| frase4.mp3 | 00:13.657 | 00:17.946 | 4.29s |
| frase5.mp3 | 00:17.946 | 00:22.731 | 4.79s |
| frase6.mp3 | 00:22.731 | 00:25.750 | 3.02s |
| frase7.mp3 | 00:25.750 | 00:28.110 | 2.36s |
| frase8.mp3 | 00:28.110 | 00:29.985 | 1.88s |
| frase9.mp3 | 00:29.985 | 00:39.484 | 9.50s |
| frase10.mp3 | 00:39.484 | 00:44.795 | 5.31s |
| frase11.mp3 | 00:44.795 | 00:49.806 | 5.01s |
| frase12.mp3 | 00:49.806 | 00:56.520 | 6.71s |
| frase13.mp3 | 00:56.520 | 01:05.936 | 9.42s |
| frase14.mp3 | 01:05.936 | 01:07.912 | 1.98s |
| frase15.mp3 | 01:07.912 | 01:14.791 | 6.88s |
| frase16.mp3 | 01:14.791 | 01:20.110 | 5.32s |
| frase17.mp3 | 01:20.110 | 01:27.733 | 7.62s |
| frase18.mp3 | 01:27.733 | 01:30.957 | 3.22s |
| frase19.mp3 | 01:30.957 | 01:35.072 | 4.12s |
| frase20.mp3 | 01:35.072 | 01:41.154 | 6.08s |
| frase21.mp3 | 01:46.860 | 01:51.500 | 4.64s |
| frase22.mp3 | 02:02.935 | 02:11.939 | 9.00s |
| frase23.mp3 | 02:11.939 | 02:17.405 | 5.47s |
| frase24.mp3 | 02:17.405 | 02:19.746 | 2.34s |
| frase25.mp3 | 02:19.746 | 02:27.457 | 7.71s |
| frase26.mp3 | 02:27.457 | 02:29.316 | 1.86s |
| frase27.mp3 | 02:29.316 | 02:34.225 | 4.91s |
| frase28.mp3 | 02:34.225 | 02:37.403 | 3.18s |
| frase29.mp3 | 02:37.403 | 02:39.188 | 1.78s |
| frase30.mp3 | 02:40.624 | 02:46.313 | 5.69s |
| frase31.mp3 | 02:46.313 | 02:52.082 | 5.77s |
| frase32.mp3 | 02:52.082 | 02:55.366 | 3.28s |
| frase33.mp3 | 02:55.366 | 03:00.454 | 5.09s |
| frase34.mp3 | 03:00.454 | 03:02.477 | 2.02s |
| frase35.mp3 | 03:02.477 | 03:05.618 | 3.14s |
| frase36.mp3 | 03:05.618 | 03:10.337 | 4.72s |

Note que frase21 (01:46.860–01:51.500) e frase30 (02:40.624–02:46.313) têm
início "aparado" em relação ao clipe anterior — o intervalo entre elas e o
fim do clipe anterior é plateia/aplauso descartado, não fala perdida.
