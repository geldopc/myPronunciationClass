import { useCallback, useEffect, useState } from "react"

import {
  readPhraseStats,
  readPracticeDays,
  recordAttempt,
} from "@/lib/attempts"
import { computeRollups } from "@/lib/rollups"
import { phrases } from "@/lib/phrases"
import { useAuth } from "@/providers/Auth"
import type { Difficulty } from "@/lib/difficulty"
import type { Rollups } from "@/lib/progress-model"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"

const EMPTY: Rollups = {
  completion: 0,
  average: 0,
  streak: 0,
  bestScoreByPhrase: {},
}

export function useProgress() {
  const { user } = useAuth()
  const [rollups, setRollups] = useState<Rollups>(EMPTY)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setRollups(EMPTY)
      return
    }
    setLoading(true)
    const [stats, days] = await Promise.all([
      readPhraseStats(user.uid),
      readPracticeDays(user.uid),
    ])
    const today = new Date().toISOString().slice(0, 10)
    setRollups(computeRollups(stats, phrases.length, days, today))
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const recordEvaluation = useCallback(
    async (
      phraseId: number,
      difficulty: Difficulty,
      evaluation: SpeechEvaluation
    ) => {
      if (!user) return
      await recordAttempt(user.uid, {
        phraseId,
        difficulty,
        score: evaluation.score,
        transcript: evaluation.transcript,
      })
      await refresh()
    },
    [user, refresh]
  )

  return { rollups, loading, recordEvaluation }
}
