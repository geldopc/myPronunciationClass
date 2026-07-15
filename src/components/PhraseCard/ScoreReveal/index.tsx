import { useEffect, useState } from "react"
import { CheckIcon } from "lucide-react"

import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"

const GREEN_THRESHOLD = 80
const NEUTRAL_THRESHOLD = 50
const COUNT_UP_MS = 600

function toneClass(score: number): string {
  if (score >= GREEN_THRESHOLD) return "text-green-600 dark:text-green-500"
  if (score >= NEUTRAL_THRESHOLD) return "text-foreground"
  return "text-destructive"
}

export function ScoreReveal({ evaluation }: { evaluation: SpeechEvaluation }) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let frame = 0
    let startTime: number | null = null

    function tick(now: number) {
      if (startTime === null) startTime = now
      const progress = Math.min((now - startTime) / COUNT_UP_MS, 1)
      setDisplayScore(Math.round(progress * evaluation.score))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [evaluation.score])

  const isSuccess = evaluation.score >= GREEN_THRESHOLD

  return (
    <div
      id="score-reveal"
      aria-live="polite"
      className="space-y-1 rounded-md border border-border p-3 text-sm"
    >
      <p className="text-muted-foreground">You said</p>
      <p className="font-medium">&ldquo;{evaluation.transcript}&rdquo;</p>
      <p
        className={`flex items-center gap-1 font-semibold ${toneClass(evaluation.score)}`}
      >
        {isSuccess && <CheckIcon />}
        Score: {displayScore}%
      </p>
    </div>
  )
}
