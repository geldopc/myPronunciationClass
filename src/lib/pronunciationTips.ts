export const pronunciationTips = [
  "Connect words ending in consonants to words starting with vowels: 'turn it' → 'tur-nit'.",
  "The 'schwa' /ə/ is English's most common vowel — unstressed syllables almost always reduce to it.",
  "In casual speech, 'want to' → 'wanna', 'going to' → 'gonna', 'have to' → 'hafta'.",
  "'T' between vowels often flaps to a soft /d/: 'better' → 'bedder', 'water' → 'wadder'.",
  "Word-final '-ing' is often reduced to '-in' in informal speech: 'talking' → 'talkin'.",
  "Content words (nouns, verbs, adjectives) are stressed; function words (the, a, to) are reduced.",
  "English has a rhythm: stressed syllables at regular intervals, unstressed syllables squeeze in between.",
  "'H' is often dropped in unstressed pronouns: 'tell him' → 'tell-im', 'ask her' → 'ask-er'.",
  "Rising intonation at the end signals a question; falling intonation signals certainty.",
  "'Could have', 'should have', 'would have' reduce to 'coulda', 'shoulda', 'woulda' in fast speech.",
  "'D' and 'T' at word ends often disappear before consonants: 'last night' → 'las' night'.",
  "Stressed syllables are louder, longer, AND higher in pitch — not just louder.",
  "'And' reduces to 'n': 'bread and butter' → 'bread-n-butter'.",
  "The 'dark L' /ɫ/ at the end of syllables ('ball', 'feel') is made further back in the mouth.",
  "'Do you' often contracts in questions: 'Do you want it?' → 'D'ya want it?'",
  "'For' in unstressed position reduces to /fər/: 'wait for me' → 'wait-fer-me'.",
  "Practice shadowing: listen to a phrase, then speak along with the recording at the same time.",
  "Record yourself and compare — your ear hears mistakes that your mouth misses.",
  "Minimal pairs (ship/sheep, bit/beat) train your ear to hear distinctions your language doesn't have.",
  "Phrase-final words carry the most stress and information — make them clear and deliberate.",
]

export function getExtraTip(phraseId: number): string {
  return pronunciationTips[phraseId % pronunciationTips.length]
}
