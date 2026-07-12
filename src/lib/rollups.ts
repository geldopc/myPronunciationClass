import type { PhraseStat, Rollups } from "@/lib/progress-model"

export function computeRollups(
  stats: PhraseStat[],
  total: number,
  practiceDays: string[],
  today: string
): Rollups {
  const practiced = stats.filter((item) => item.attemptsCount > 0)
  const completion =
    total === 0 ? 0 : Math.round((practiced.length / total) * 100)
  const average =
    practiced.length === 0
      ? 0
      : Math.round(
          practiced.reduce((sum, item) => sum + item.bestScore, 0) /
            practiced.length
        )
  const bestScoreByPhrase = Object.fromEntries(
    stats.map((item) => [item.phraseId, item.bestScore])
  )
  return { completion, average, streak: computeStreak(practiceDays, today), bestScoreByPhrase }
}

export function computeStreak(days: string[], today: string): number {
  const set = new Set(days)
  let streak = 0
  let cursor = today
  while (set.has(cursor)) {
    streak += 1
    cursor = previousDay(cursor)
  }
  return streak
}

function previousDay(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}
