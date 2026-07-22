import * as admin from "firebase-admin"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, "serviceAccount.json"), "utf-8")
)

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const phrasesData = [
  {
    order: 1,
    speaker: "Chandler",
    text: "Damn, Rolos. Hey, you're back! Hey, how was your conference?",
    pronunciationHint:
      '"you\'re" reduz para /jɚ/ ("yer"). "how was" conecta como "how-wuz".',
    startTime: 0.0,
    endTime: 8.395,
  },
  {
    order: 2,
    speaker: "Rachel",
    text: "It was terrible. I fought with",
    pronunciationHint:
      '"It was" contrai para "it-wuz". "fought with" liga o /t/ final ao /w/.',
    startTime: 8.395,
    endTime: 10.823,
  },
  {
    order: 3,
    speaker: "Rachel",
    text: "My colleagues, you know, the entire time. Are you kidding?",
    pronunciationHint:
      '"Are you" reduz para /ɚjə/ ("ar-ya"). "kidding" tem flap-t no meio.',
    startTime: 10.823,
    endTime: 13.657,
  },
  {
    order: 4,
    speaker: "Chandler",
    text: "With this? So your weekend was a total bust?",
    pronunciationHint:
      '"total" tem flap-t: soa "toh-dl". "your" reduz para /jɚ/.',
    startTime: 13.657,
    endTime: 17.946,
  },
  {
    order: 5,
    speaker: "Rachel",
    text: "Uh, no. I got to see Donald Trump waiting for an elevator.",
    pronunciationHint:
      '"got to" vira "gotta" /ˈɡɑːtə/. "waiting for an" conecta tudo sem pausas.',
    startTime: 17.946,
    endTime: 22.731,
  },
  {
    order: 6,
    speaker: "Chandler",
    text: "Hi. Hey, you're back, too. Yeah.",
    pronunciationHint:
      '"you\'re" reduzido /jɚ/. "too" com vogal longa /uː/ no fim.',
    startTime: 22.731,
    endTime: 25.75,
  },
  {
    order: 7,
    speaker: "Ross",
    text: "Yeah, Chandler, can I talk to you outside for just a second?",
    pronunciationHint:
      '"can I" conecta como "kuh-nai". "talk to you" reduz "to" para /tə/.',
    startTime: 25.75,
    endTime: 28.11,
  },
  {
    order: 8,
    speaker: "Rachel",
    text: "Hey, how was your chef thing?",
    pronunciationHint: '"was your" liga em "wuh-zher".',
    startTime: 28.11,
    endTime: 29.985,
  },
  {
    order: 9,
    speaker: "Monica",
    text: "It was awful. I guess some people just don't appreciate really good food. Well, maybe it was the kind of food that tasted good at first, but then made everybody vomit and have diarrhea.",
    pronunciationHint:
      '"don\'t" com /t/ quase mudo antes de consoante. "kind of" reduz para "kinda". Flap-t em "tasted".',
    startTime: 29.985,
    endTime: 39.484,
  },
  {
    order: 10,
    speaker: "Rachel",
    text: "Chandler? Monica?",
    pronunciationHint:
      "Nomes próprios em tom de pergunta chamando alguém: entonação subindo no final.",
    startTime: 39.484,
    endTime: 44.795,
  },
  {
    order: 11,
    speaker: "Rachel",
    text: "Mr. Bing?",
    pronunciationHint: '"Mister" reduz para /ˈmɪstɚ/, quase sem o "i" central.',
    startTime: 44.795,
    endTime: 49.806,
  },
  {
    order: 12,
    speaker: "Rachel",
    text: "That hotel you stayed at called. Said someone left an eyelash curler in your room.",
    pronunciationHint:
      '"stayed at" linka o /d/ ao /æ/. "eyelash curler" com "r" americano forte.',
    startTime: 49.806,
    endTime: 56.52,
  },
  {
    order: 13,
    speaker: "Chandler",
    text: "Yes, that was mine. 'Cause I figured you hooked up with some girl and she left it there.",
    pronunciationHint:
      '"\'Cause" é redução de "because", soa /kəz/. "hooked up with" encadeia sem pausas.',
    startTime: 56.52,
    endTime: 65.936,
  },
  {
    order: 14,
    speaker: "Rachel",
    text: "Yes, that would have made more sense.",
    pronunciationHint:
      '"would have" reduz para "would\'ve" /ˈwʊdəv/, nunca pronuncie o "have" cheio.',
    startTime: 65.936,
    endTime: 67.912,
  },
  {
    order: 15,
    speaker: "Ross",
    text: "You know, I don't even feel like I know you anymore, man. All right?",
    pronunciationHint:
      '"don\'t even" perde o /t/ de "don\'t". "anymore" vira uma palavra só na fala corrida.',
    startTime: 67.912,
    endTime: 74.791,
  },
  {
    order: 16,
    speaker: "Ross",
    text: "Look, I'm just gonna ask you this one time, all right? And whatever you say, I'll believe you.",
    pronunciationHint:
      '"gonna" = "going to" reduzido. "ask you" funde o /k/ ao /j/, quase "askyuh".',
    startTime: 74.791,
    endTime: 80.11,
  },
  {
    order: 17,
    speaker: "Ross",
    text: "Were you, or were you not, on a gay cruise?",
    pronunciationHint:
      '"Were you" reduz para "wer-yuh". Pausa curta antes de "on a gay cruise" para dar ênfase.',
    startTime: 80.11,
    endTime: 87.733,
  },
  {
    order: 18,
    speaker: "Chandler",
    text: "Hey. Hey. Hey. Oh, hey, Monica.",
    pronunciationHint:
      'Cada "Hey" com entonação diferente: cumprimento, resposta, depois reconhecimento ("Oh, hey").',
    startTime: 87.733,
    endTime: 90.957,
  },
  {
    order: 19,
    speaker: "Rachel",
    text: "I heard you saw Donald Trump at your convention. Yeah, saw him waiting for an elevator.",
    pronunciationHint:
      '"heard you" funde /d/ + /j/ perto de "herjuh". "saw him" quase perde o "h": "saw-im".',
    startTime: 90.957,
    endTime: 95.072,
  },
  {
    order: 20,
    speaker: "Monica",
    text: "Hey, Rachel, can I borrow your eyelash curler? I think I lost mine.",
    pronunciationHint:
      '"can I borrow" encadeia rápido. "think I" liga o /k/ ao /aɪ/ sem pausa.',
    startTime: 95.072,
    endTime: 101.154,
  },
  {
    order: 21,
    speaker: "Chandler",
    text: "Joey, can I talk to you for a second?",
    pronunciationHint:
      '"can I" soa "kuh-nai". "talk to you" reduz "to" para /tə/, igual à frase 7.',
    startTime: 106.86,
    endTime: 111.5,
  },
  {
    order: 22,
    speaker: "Joey",
    text: "Yes. Yes. You? And you?",
    pronunciationHint:
      '"And you" conecta "d" + "y" quase como "an-juh". Cada palavra isolada, sem juntar.',
    startTime: 122.935,
    endTime: 131.939,
  },
  {
    order: 23,
    speaker: "Monica",
    text: "Yes, but you cannot tell anyone, no one knows. How, when?",
    pronunciationHint:
      '"cannot" aqui é enfático, não reduz (diferente de "can\'t"). "tell anyone" liga o /l/ ao /ɛ/.',
    startTime: 131.939,
    endTime: 137.405,
  },
  {
    order: 24,
    speaker: "Chandler",
    text: "It happened in London.",
    pronunciationHint:
      '"happened in" liga o /d/ ao /ɪ/ sem pausa. "London" com "o" curto /ʌ/.',
    startTime: 137.405,
    endTime: 139.746,
  },
  {
    order: 25,
    speaker: "Joey",
    text: "In London?! The reason we didn't tell anyone was because we didn't want to make a big deal out of it.",
    pronunciationHint:
      '"didn\'t" tem o /t/ quase engolido antes de consoante. "want to" reduz para "wanna".',
    startTime: 139.746,
    endTime: 147.457,
  },
  {
    order: 26,
    speaker: "Monica",
    text: "But it is a big deal!",
    pronunciationHint: '"But it is" conecta "t" + vogal: "buh-tit-iz".',
    startTime: 147.457,
    endTime: 149.316,
  },
  {
    order: 27,
    speaker: "Joey",
    text: "I have to tell someone. You can't.",
    pronunciationHint:
      '"have to" reduz para "hafta". "can\'t" com vogal mais longa e /t/ final marcado.',
    startTime: 149.316,
    endTime: 154.225,
  },
  {
    order: 28,
    speaker: "Chandler",
    text: "Please, please, we just don't want to deal with telling everyone, okay?",
    pronunciationHint:
      '"want to" reduz para "wanna". "deal with" conecta o /l/ ao /w/ sem pausa.',
    startTime: 154.225,
    endTime: 157.403,
  },
  {
    order: 29,
    speaker: "Monica",
    text: "Just promise you won't tell.",
    pronunciationHint:
      '"won\'t" tem vogal /oʊ/ bem aberta — não confundir com "want". "promise you" funde /s/ + /j/.',
    startTime: 157.403,
    endTime: 159.188,
  },
  {
    order: 30,
    speaker: "Joey",
    text: "All right!",
    pronunciationHint:
      '"All right" vira quase uma palavra só, "awright", com entonação de aceitação resignada.',
    startTime: 160.624,
    endTime: 166.313,
  },
  {
    order: 31,
    speaker: "Joey",
    text: "Man, this is unbelievable! I mean, it's great, but",
    pronunciationHint:
      '"this is" conecta o /s/ final ao /ɪ/. "it\'s great" junta o /s/ ao /ɡ/ sem pausa.',
    startTime: 166.313,
    endTime: 172.082,
  },
  {
    order: 32,
    speaker: "Monica",
    text: "I know it's great.",
    pronunciationHint:
      '"I know" com ditongo /oʊ/ completo. "it\'s great" sem pausa entre as palavras.',
    startTime: 172.082,
    endTime: 175.366,
  },
  {
    order: 33,
    speaker: "Joey",
    text: "Oh, I don't want to see that.",
    pronunciationHint:
      '"want to" reduz para "wanna". Na fala rápida soa quase "dohn-wanna see that".',
    startTime: 175.366,
    endTime: 180.454,
  },
  {
    order: 34,
    speaker: "Monica",
    text: "We're so stupid.",
    pronunciationHint:
      '"We\'re" reduz para /wɪr/. "stupid" com flap-t no meio, som suave de "d".',
    startTime: 180.454,
    endTime: 182.477,
  },
  {
    order: 35,
    speaker: "Rachel",
    text: "Do you know what's going on in there?",
    pronunciationHint:
      '"Do you" funde em "d\'ya". "going on" e "on in" ligam vogal a vogal sem pausa.',
    startTime: 182.477,
    endTime: 185.618,
  },
  {
    order: 36,
    speaker: "Joey",
    text: "They're trying to take Joey.",
    pronunciationHint:
      '"trying to" reduz para "tryna" na fala informal. "take Joey" com o "J" bem marcado /dʒ/.',
    startTime: 185.618,
    endTime: 190.337,
  },
]

async function seed() {
  const LESSON_ID = "friends-s5e14"
  const ADMIN_EMAIL = "geldopc@gmail.com"

  console.log("Seeding lesson…")
  await db.collection("lessons").doc(LESSON_ID).set(
    {
      title: "Friends S5E14 — Joey Finds Out",
      youtubeId: "XZVHmRvfDHM",
      thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
      createdAt: admin.firestore.Timestamp.now(),
      createdBy: "system",
    },
    { merge: true }
  )

  console.log("Seeding 36 phrases…")
  const batch = db.batch()
  for (const p of phrasesData) {
    const phraseId = `phrase-${p.order}`
    const ref = db
      .collection("lessons")
      .doc(LESSON_ID)
      .collection("phrases")
      .doc(phraseId)
    batch.set(ref, p, { merge: true })
  }
  await batch.commit()

  console.log("Seeding admin…")
  await db.collection("admins").doc(ADMIN_EMAIL).set(
    {
      status: "active",
      invitedBy: "system",
      invitedAt: admin.firestore.Timestamp.now(),
      activatedAt: admin.firestore.Timestamp.now(),
    },
    { merge: true }
  )

  console.log(
    `Done! Seeded ${LESSON_ID} with ${phrasesData.length} phrases + admin ${ADMIN_EMAIL}`
  )
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
