export type Difficulty = "easy" | "moderate" | "hard"

export type RevealState = {
  showText: boolean
  showHint: boolean
  canPeekHint: boolean
}

export function getRevealState(
  difficulty: Difficulty,
  attempted: boolean
): RevealState {
  if (attempted) {
    return { showText: true, showHint: true, canPeekHint: false }
  }

  switch (difficulty) {
    case "easy":
      return { showText: true, showHint: true, canPeekHint: false }
    case "moderate":
      return { showText: true, showHint: false, canPeekHint: true }
    case "hard":
      return { showText: false, showHint: false, canPeekHint: false }
  }
}
