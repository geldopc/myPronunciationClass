export type Phrase = {
  id: number
  text: string
  audioSrc: string
  pronunciationHint: string
  speaker: string
  startTime: number
  endTime: number
}

export const SOURCE_VIDEO_ID = "XZVHmRvfDHM"

/**
 * Roteiro do trecho "Friends – Joey Finds Out" (S5), alinhado aos 36 áudios
 * em `public/audios/frase1.mp3`..`frase36.mp3`. Cada texto foi conferido
 * contra uma transcrição automática do próprio arquivo de áudio cortado
 * (não do arquivo de origem), para garantir que o texto bate com a fala
 * ouvida naquele clipe específico. Ver AUDIO_CUTS.md para os intervalos.
 */
export const phrases: Phrase[] = [
  {
    id: 1,
    speaker: "Chandler",
    text: "Damn, Rolos. Hey, you're back! Hey, how was your conference?",
    audioSrc: "/audios/frase1.mp3",
    pronunciationHint:
      '"you\'re" reduz para /jɚ/ ("yer"). "how was" conecta como "how-wuz".',
    startTime: 0.0,
    endTime: 8.395,
  },
  {
    id: 2,
    speaker: "Rachel",
    text: "It was terrible. I fought with",
    audioSrc: "/audios/frase2.mp3",
    pronunciationHint:
      '"It was" contrai para "it-wuz". "fought with" liga o /t/ final ao /w/.',
    startTime: 8.395,
    endTime: 10.823,
  },
  {
    id: 3,
    speaker: "Rachel",
    text: "My colleagues, you know, the entire time. Are you kidding?",
    audioSrc: "/audios/frase3.mp3",
    pronunciationHint:
      '"Are you" reduz para /ɚjə/ ("ar-ya"). "kidding" tem flap-t no meio.',
    startTime: 10.823,
    endTime: 13.657,
  },
  {
    id: 4,
    speaker: "Chandler",
    text: "With this? So your weekend was a total bust?",
    audioSrc: "/audios/frase4.mp3",
    pronunciationHint:
      '"total" tem flap-t: soa "toh-dl". "your" reduz para /jɚ/.',
    startTime: 13.657,
    endTime: 17.946,
  },
  {
    id: 5,
    speaker: "Rachel",
    text: "Uh, no. I got to see Donald Trump waiting for an elevator.",
    audioSrc: "/audios/frase5.mp3",
    pronunciationHint:
      '"got to" vira "gotta" /ˈɡɑːtə/. "waiting for an" conecta tudo sem pausas.',
    startTime: 17.946,
    endTime: 22.731,
  },
  {
    id: 6,
    speaker: "Chandler",
    text: "Hi. Hey, you're back, too. Yeah.",
    audioSrc: "/audios/frase6.mp3",
    pronunciationHint:
      '"you\'re" reduzido /jɚ/. "too" com vogal longa /uː/ no fim.',
    startTime: 22.731,
    endTime: 25.75,
  },
  {
    id: 7,
    speaker: "Ross",
    text: "Yeah, Chandler, can I talk to you outside for just a second?",
    audioSrc: "/audios/frase7.mp3",
    pronunciationHint:
      '"can I" conecta como "kuh-nai". "talk to you" reduz "to" para /tə/.',
    startTime: 25.75,
    endTime: 28.11,
  },
  {
    id: 8,
    speaker: "Rachel",
    text: "Hey, how was your chef thing?",
    audioSrc: "/audios/frase8.mp3",
    pronunciationHint: '"was your" liga em "wuh-zher".',
    startTime: 28.11,
    endTime: 29.985,
  },
  {
    id: 9,
    speaker: "Monica",
    text: "It was awful. I guess some people just don't appreciate really good food. Well, maybe it was the kind of food that tasted good at first, but then made everybody vomit and have diarrhea.",
    audioSrc: "/audios/frase9.mp3",
    pronunciationHint:
      '"don\'t" com /t/ quase mudo antes de consoante. "kind of" reduz para "kinda". Flap-t em "tasted".',
    startTime: 29.985,
    endTime: 39.484,
  },
  {
    id: 10,
    speaker: "Rachel",
    text: "Chandler? Monica?",
    audioSrc: "/audios/frase10.mp3",
    pronunciationHint:
      "Nomes próprios em tom de pergunta chamando alguém: entonação subindo no final.",
    startTime: 39.484,
    endTime: 44.795,
  },
  {
    id: 11,
    speaker: "Rachel",
    text: "Mr. Bing?",
    audioSrc: "/audios/frase11.mp3",
    pronunciationHint: '"Mister" reduz para /ˈmɪstɚ/, quase sem o "i" central.',
    startTime: 44.795,
    endTime: 49.806,
  },
  {
    id: 12,
    speaker: "Rachel",
    text: "That hotel you stayed at called. Said someone left an eyelash curler in your room.",
    audioSrc: "/audios/frase12.mp3",
    pronunciationHint:
      '"stayed at" linka o /d/ ao /æ/. "eyelash curler" com "r" americano forte.',
    startTime: 49.806,
    endTime: 56.52,
  },
  {
    id: 13,
    speaker: "Chandler",
    text: "Yes, that was mine. 'Cause I figured you hooked up with some girl and she left it there.",
    audioSrc: "/audios/frase13.mp3",
    pronunciationHint:
      '"\'Cause" é redução de "because", soa /kəz/. "hooked up with" encadeia sem pausas.',
    startTime: 56.52,
    endTime: 65.936,
  },
  {
    id: 14,
    speaker: "Rachel",
    text: "Yes, that would have made more sense.",
    audioSrc: "/audios/frase14.mp3",
    pronunciationHint:
      '"would have" reduz para "would\'ve" /ˈwʊdəv/, nunca pronuncie o "have" cheio.',
    startTime: 65.936,
    endTime: 67.912,
  },
  {
    id: 15,
    speaker: "Ross",
    text: "You know, I don't even feel like I know you anymore, man. All right?",
    audioSrc: "/audios/frase15.mp3",
    pronunciationHint:
      '"don\'t even" perde o /t/ de "don\'t". "anymore" vira uma palavra só na fala corrida.',
    startTime: 67.912,
    endTime: 74.791,
  },
  {
    id: 16,
    speaker: "Ross",
    text: "Look, I'm just gonna ask you this one time, all right? And whatever you say, I'll believe you.",
    audioSrc: "/audios/frase16.mp3",
    pronunciationHint:
      '"gonna" = "going to" reduzido. "ask you" funde o /k/ ao /j/, quase "askyuh".',
    startTime: 74.791,
    endTime: 80.11,
  },
  {
    id: 17,
    speaker: "Ross",
    text: "Were you, or were you not, on a gay cruise?",
    audioSrc: "/audios/frase17.mp3",
    pronunciationHint:
      '"Were you" reduz para "wer-yuh". Pausa curta antes de "on a gay cruise" para dar ênfase.',
    startTime: 80.11,
    endTime: 87.733,
  },
  {
    id: 18,
    speaker: "Chandler",
    text: "Hey. Hey. Hey. Oh, hey, Monica.",
    audioSrc: "/audios/frase18.mp3",
    pronunciationHint:
      'Cada "Hey" com entonação diferente: cumprimento, resposta, depois reconhecimento ("Oh, hey").',
    startTime: 87.733,
    endTime: 90.957,
  },
  {
    id: 19,
    speaker: "Rachel",
    text: "I heard you saw Donald Trump at your convention. Yeah, saw him waiting for an elevator.",
    audioSrc: "/audios/frase19.mp3",
    pronunciationHint:
      '"heard you" funde /d/ + /j/ perto de "herjuh". "saw him" quase perde o "h": "saw-im".',
    startTime: 90.957,
    endTime: 95.072,
  },
  {
    id: 20,
    speaker: "Monica",
    text: "Hey, Rachel, can I borrow your eyelash curler? I think I lost mine.",
    audioSrc: "/audios/frase20.mp3",
    pronunciationHint:
      '"can I borrow" encadeia rápido. "think I" liga o /k/ ao /aɪ/ sem pausa.',
    startTime: 95.072,
    endTime: 101.154,
  },
  {
    id: 21,
    speaker: "Chandler",
    text: "Joey, can I talk to you for a second?",
    audioSrc: "/audios/frase21.mp3",
    pronunciationHint:
      '"can I" soa "kuh-nai". "talk to you" reduz "to" para /tə/, igual à frase 7.',
    startTime: 106.86,
    endTime: 111.5,
  },
  {
    id: 22,
    speaker: "Joey",
    text: "Yes. Yes. You? And you?",
    audioSrc: "/audios/frase22.mp3",
    pronunciationHint:
      '"And you" conecta "d" + "y" quase como "an-juh". Cada palavra isolada, sem juntar.',
    startTime: 122.935,
    endTime: 131.939,
  },
  {
    id: 23,
    speaker: "Monica",
    text: "Yes, but you cannot tell anyone, no one knows. How, when?",
    audioSrc: "/audios/frase23.mp3",
    pronunciationHint:
      '"cannot" aqui é enfático, não reduz (diferente de "can\'t"). "tell anyone" liga o /l/ ao /ɛ/.',
    startTime: 131.939,
    endTime: 137.405,
  },
  {
    id: 24,
    speaker: "Chandler",
    text: "It happened in London.",
    audioSrc: "/audios/frase24.mp3",
    pronunciationHint:
      '"happened in" liga o /d/ ao /ɪ/ sem pausa. "London" com "o" curto /ʌ/.',
    startTime: 137.405,
    endTime: 139.746,
  },
  {
    id: 25,
    speaker: "Joey",
    text: "In London?! The reason we didn't tell anyone was because we didn't want to make a big deal out of it.",
    audioSrc: "/audios/frase25.mp3",
    pronunciationHint:
      '"didn\'t" tem o /t/ quase engolido antes de consoante. "want to" reduz para "wanna".',
    startTime: 139.746,
    endTime: 147.457,
  },
  {
    id: 26,
    speaker: "Monica",
    text: "But it is a big deal!",
    audioSrc: "/audios/frase26.mp3",
    pronunciationHint: '"But it is" conecta "t" + vogal: "buh-tit-iz".',
    startTime: 147.457,
    endTime: 149.316,
  },
  {
    id: 27,
    speaker: "Joey",
    text: "I have to tell someone. You can't.",
    audioSrc: "/audios/frase27.mp3",
    pronunciationHint:
      '"have to" reduz para "hafta". "can\'t" com vogal mais longa e /t/ final marcado.',
    startTime: 149.316,
    endTime: 154.225,
  },
  {
    id: 28,
    speaker: "Chandler",
    text: "Please, please, we just don't want to deal with telling everyone, okay?",
    audioSrc: "/audios/frase28.mp3",
    pronunciationHint:
      '"want to" reduz para "wanna". "deal with" conecta o /l/ ao /w/ sem pausa.',
    startTime: 154.225,
    endTime: 157.403,
  },
  {
    id: 29,
    speaker: "Monica",
    text: "Just promise you won't tell.",
    audioSrc: "/audios/frase29.mp3",
    pronunciationHint:
      '"won\'t" tem vogal /oʊ/ bem aberta — não confundir com "want". "promise you" funde /s/ + /j/.',
    startTime: 157.403,
    endTime: 159.188,
  },
  {
    id: 30,
    speaker: "Joey",
    text: "All right!",
    audioSrc: "/audios/frase30.mp3",
    pronunciationHint:
      '"All right" vira quase uma palavra só, "awright", com entonação de aceitação resignada.',
    startTime: 160.624,
    endTime: 166.313,
  },
  {
    id: 31,
    speaker: "Joey",
    text: "Man, this is unbelievable! I mean, it's great, but",
    audioSrc: "/audios/frase31.mp3",
    pronunciationHint:
      '"this is" conecta o /s/ final ao /ɪ/. "it\'s great" junta o /s/ ao /ɡ/ sem pausa.',
    startTime: 166.313,
    endTime: 172.082,
  },
  {
    id: 32,
    speaker: "Monica",
    text: "I know it's great.",
    audioSrc: "/audios/frase32.mp3",
    pronunciationHint:
      '"I know" com ditongo /oʊ/ completo. "it\'s great" sem pausa entre as palavras.',
    startTime: 172.082,
    endTime: 175.366,
  },
  {
    id: 33,
    speaker: "Joey",
    text: "Oh, I don't want to see that.",
    audioSrc: "/audios/frase33.mp3",
    pronunciationHint:
      '"want to" reduz para "wanna". Na fala rápida soa quase "dohn-wanna see that".',
    startTime: 175.366,
    endTime: 180.454,
  },
  {
    id: 34,
    speaker: "Monica",
    text: "We're so stupid.",
    audioSrc: "/audios/frase34.mp3",
    pronunciationHint:
      '"We\'re" reduz para /wɪr/. "stupid" com flap-t no meio, som suave de "d".',
    startTime: 180.454,
    endTime: 182.477,
  },
  {
    id: 35,
    speaker: "Rachel",
    text: "Do you know what's going on in there?",
    audioSrc: "/audios/frase35.mp3",
    pronunciationHint:
      '"Do you" funde em "d\'ya". "going on" e "on in" ligam vogal a vogal sem pausa.',
    startTime: 182.477,
    endTime: 185.618,
  },
  {
    id: 36,
    speaker: "Joey",
    text: "They're trying to take Joey.",
    audioSrc: "/audios/frase36.mp3",
    pronunciationHint:
      '"trying to" reduz para "tryna" na fala informal. "take Joey" com o "J" bem marcado /dʒ/.',
    startTime: 185.618,
    endTime: 190.337,
  },
]

export function isPhraseReady(phrase: Phrase): boolean {
  return !phrase.text.startsWith("SUBSTITUA_PELA_FRASE_")
}
