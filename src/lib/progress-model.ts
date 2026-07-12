import type { Difficulty } from "@/lib/difficulty"

export type Attempt = {
  phraseId: number
  difficulty: Difficulty
  score: number
  transcript: string
}

export type PhraseStat = {
  phraseId: number
  bestScore: number
  attemptsCount: number
  lastPracticedAt: number
}

export type Rollups = {
  completion: number
  average: number
  streak: number
  bestScoreByPhrase: Record<number, number>
}

export type ShareProfile = {
  displayName: string
  avatarUrl: string
}

export type ShareSnapshot = Rollups

export type Share = ShareProfile & {
  snapshot: ShareSnapshot
  createdAt: number
}
