/**
 * Normalizes strings before comparing speech-recognition output with a target
 * sentence. Accents, case, punctuation, and extra spaces do not affect score.
 */
export function normalizeSpeechText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function levenshteinDistance(first: string, second: string): number {
  if (first === second) return 0;
  if (!first) return second.length;
  if (!second) return first.length;

  let previousRow = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const currentRow = [firstIndex];

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitutionCost =
        first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;

      currentRow[secondIndex] = Math.min(
        currentRow[secondIndex - 1] + 1,
        previousRow[secondIndex] + 1,
        previousRow[secondIndex - 1] + substitutionCost,
      );
    }

    previousRow = currentRow;
  }

  return previousRow[second.length];
}

/** Returns an integer percentage from 0 through 100. */
export function getSimilarityPercentage(target: string, transcript: string): number {
  const normalizedTarget = normalizeSpeechText(target);
  const normalizedTranscript = normalizeSpeechText(transcript);

  if (!normalizedTarget || !normalizedTranscript) return 0;

  const longestText = Math.max(normalizedTarget.length, normalizedTranscript.length);
  const distance = levenshteinDistance(normalizedTarget, normalizedTranscript);

  return Math.round((1 - distance / longestText) * 100);
}
