import { useEffect, useState } from "react"
import {
  EyeIcon,
  MicIcon,
  PlayIcon,
  SquareIcon,
  Volume2Icon,
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
  const phraseReady = isPhraseReady(phrase)
  const attempted = Boolean(evaluation)
  const reveal = getRevealState(difficulty, attempted)

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

  const showHint = reveal.showHint || (reveal.canPeekHint && peeked)

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
        </div>
        {reveal.showText ? (
          <p className="text-lg leading-relaxed">{phrase.text}</p>
        ) : (
          <p className="text-lg text-muted-foreground italic">
            Ouça e repita — o texto aparece depois da sua tentativa.
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {showHint && (
          <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Dica de pronúncia:{" "}
            </span>
            {phrase.pronunciationHint}
          </div>
        )}

        {reveal.canPeekHint && !showHint && (
          <Button variant="ghost" size="sm" onClick={() => setPeeked(true)}>
            <EyeIcon /> Ver dica
          </Button>
        )}

        {evaluation && <ScoreReveal evaluation={evaluation} />}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {!supportsSpeechRecognition && (
          <p className="text-sm text-destructive">
            Seu navegador não oferece suporte ao reconhecimento de voz.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          onClick={() => onPlay(phrase)}
          disabled={!phraseReady || isAnyPhraseRecording}
        >
          {isPlaying ? (
            <>
              <Volume2Icon /> Tocando…
            </>
          ) : (
            <>
              <PlayIcon /> Ouvir
            </>
          )}
        </Button>
        <Button
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
              <SquareIcon /> Parar
            </>
          ) : (
            <>
              <MicIcon /> Repetir
            </>
          )}
        </Button>
        {isRecording && (
          <span
            className="self-center text-sm font-medium text-destructive"
            aria-live="polite"
          >
            Ouvindo…
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
