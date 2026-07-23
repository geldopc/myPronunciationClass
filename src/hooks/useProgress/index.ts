import { useCallback, useEffect, useState } from "react"

import {
  readPhraseStats,
  readPracticeDays,
  recordAttempt,
} from "@/lib/attempts"
import { computeRollups } from "@/lib/rollups"
import { useAuth } from "@/providers/Auth"
import type { Difficulty } from "@/lib/difficulty"
import type { PhraseStat, Rollups } from "@/lib/progress-model"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"

const EMPTY: Rollups = {
  completion: 0,
  average: 0,
  streak: 0,
  bestScoreByPhrase: {},
  byLesson: [],
}

export function useProgress(lessonId?: string, phraseTotal?: number) {
  const { user } = useAuth()
  const [rollups, setRollups] = useState<Rollups>(EMPTY)
  const [phraseStats, setPhraseStats] = useState<PhraseStat[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setRollups(EMPTY)
      setPhraseStats([])
      return
    }
    setLoading(true)
    const [stats, days] = await Promise.all([
      readPhraseStats(user.uid, lessonId),
      readPracticeDays(user.uid),
    ])
    const today = new Date().toISOString().slice(0, 10)
    setRollups(computeRollups(stats, phraseTotal ?? stats.length, days, today))
    setPhraseStats(
      [...stats].sort((a, b) => a.phraseId.localeCompare(b.phraseId))
    )
    setLoading(false)
  }, [user, lessonId, phraseTotal])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const recordEvaluation = useCallback(
    async (
      phraseId: string,
      lessonIdArg: string,
      difficulty: Difficulty,
      evaluation: SpeechEvaluation
    ) => {
      if (!user) return
      await recordAttempt(user.uid, {
        lessonId: lessonIdArg,
        phraseId,
        difficulty,
        score: evaluation.score,
        transcript: evaluation.transcript,
      })
      await refresh()
    },
    [user, refresh]
  )

  return { rollups, phraseStats, loading, recordEvaluation }
}
