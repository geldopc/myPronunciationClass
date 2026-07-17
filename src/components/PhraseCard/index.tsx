import { useEffect, useState } from "react"
import {
  EyeIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { ScoreReveal } from "@/components/PhraseCard/ScoreReveal"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import { getRevealState } from "@/lib/difficulty"
import type { Difficulty } from "@/lib/difficulty"
import { isPhraseReady } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"
import { getExtraTip } from "@/lib/pronunciationTips"

type PhraseCardProps = {
  phrase: Phrase
  difficulty: Difficulty
  isPlaying: boolean
  isAnyPhrasePlaying: boolean
  isAnyPhraseRecording: boolean
  isAnotherPhraseRecording: boolean
  supportsSpeechRecognition: boolean
  evaluation?: SpeechEvaluation
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
  registerToggle: (phraseId: number, toggle: (() => void) | null) => void
}

export function PhraseCard({
  phrase,
  difficulty,
  isPlaying,
  isAnyPhrasePlaying,
  isAnyPhraseRecording,
  isAnotherPhraseRecording,
  supportsSpeechRecognition,
  evaluation,
  onPlay,
  onRecordingChange,
  onEvaluation,
  registerToggle,
}: PhraseCardProps) {
  const [peeked, setPeeked] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const phraseReady = isPhraseReady(phrase)
  const attempted = Boolean(evaluation)
  const reveal = getRevealState(difficulty, attempted)
  // Compute showHint before any useEffect that lists it as a dependency
  const showHint = reveal.showHint || (reveal.canPeekHint && peeked)
  const extraTip = getExtraTip(phrase.id)

  useEffect(() => {
    setPeeked(false)
  }, [difficulty])

  // Reset to first slide whenever the carousel closes or the phrase changes
  useEffect(() => {
    setTipIndex(0)
  }, [phrase.id, showHint])

  const { isRecording, error, start, stop } = useSpeechRecognition({
    supported: supportsSpeechRecognition,
    onEvaluation: (result) => onEvaluation(phrase.id, result),
    onRecordingChange: (recording) =>
      onRecordingChange(recording ? phrase.id : null),
  })

  function toggleRecording() {
    if (isRecording) {
      stop()
      return
    }
    if (isAnyPhrasePlaying || !phraseReady || !supportsSpeechRecognition) return
    start(phrase.text)
  }

  useEffect(() => {
    registerToggle(phrase.id, toggleRecording)
    return () => registerToggle(phrase.id, null)
  })

  return (
    <Card id={`phrase-card-${phrase.id}`}>
      <CardHeader className="gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
            {phrase.speaker.charAt(0)}
          </span>
          <span className="font-medium text-foreground">{phrase.speaker}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">
            {String(phrase.id).padStart(2, "0")}
          </span>
          {reveal.canPeekHint && (
            <button
              type="button"
              onClick={() => setPeeked((p) => !p)}
              className="ml-auto flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              aria-label={peeked ? "Hide hint" : "Show hint"}
            >
              <EyeIcon className="h-3 w-3" />
              {peeked ? "Hide" : "Hint"}
            </button>
          )}
        </div>
        {reveal.showText ? (
          <p className="text-lg leading-relaxed">{phrase.text}</p>
        ) : (
          <p className="text-lg text-muted-foreground italic">
            Listen and repeat — the text appears after your attempt.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {showHint && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">
                {tipIndex === 0 ? "Phonetic tip" : "Technique tip"}
              </span>
              <div className="flex gap-1">
                {[0, 1].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTipIndex(i)}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                      tipIndex === i
                        ? "bg-foreground"
                        : "bg-muted-foreground/30"
                    }`}
                    aria-label={`Tip ${i + 1}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-muted-foreground">
              {tipIndex === 0 ? phrase.pronunciationHint : extraTip}
            </p>
          </div>
        )}

        {evaluation && <ScoreReveal evaluation={evaluation} />}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {!supportsSpeechRecognition && (
          <p className="text-sm text-destructive">
            Your browser doesn't support speech recognition.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          className="flex-1"
          onClick={() => onPlay(phrase)}
          disabled={!phraseReady || isAnyPhraseRecording}
        >
          {isPlaying ? (
            <>
              <PauseIcon /> Pause
            </>
          ) : (
            <>
              <PlayIcon /> Listen
            </>
          )}
        </Button>
        <Button
          className="flex-1"
          variant={isRecording ? "destructive" : "secondary"}
          onClick={toggleRecording}
          disabled={
            !phraseReady ||
            !supportsSpeechRecognition ||
            isAnotherPhraseRecording ||
            isAnyPhrasePlaying
          }
        >
          {isRecording ? (
            <>
              <SquareIcon /> Stop
            </>
          ) : (
            <>
              <MicIcon /> Repeat
            </>
          )}
        </Button>
        {isRecording && (
          <span
            className="self-center text-sm font-medium text-destructive"
            aria-live="polite"
          >
            Listening…
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
