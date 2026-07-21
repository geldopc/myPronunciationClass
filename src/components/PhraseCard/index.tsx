import { useEffect, useState } from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  EyeIcon,
  MicIcon,
  PauseIcon,
  PlayIcon,
  SquareIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ScoreReveal } from "@/components/PhraseCard/ScoreReveal"
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import { getRevealState } from "@/lib/difficulty"
import type { Difficulty } from "@/lib/difficulty"
import { isPhraseReady } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"
import { getExtraTip } from "@/lib/pronunciationTips"

type NavProps = {
  onPrev?: () => void
  onNext?: () => void
  prevDisabled?: boolean
  nextDisabled?: boolean
  label?: string
}

type PhraseCardProps = {
  phrase: Phrase
  difficulty: Difficulty
  isPlaying: boolean
  isAnyPhrasePlaying: boolean
  isAnyPhraseRecording: boolean
  isAnotherPhraseRecording: boolean
  supportsSpeechRecognition: boolean
  evaluation?: SpeechEvaluation
  nav?: NavProps
  /** Render as the bottom half of a unified panel: square top corners,
   *  no shadow/ring, fills available vertical space with footer pinned. */
  flat?: boolean
  className?: string
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
  nav,
  flat = false,
  className,
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
    setTipIndex(0)
  }, [phrase.id, difficulty])

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

  useEffect(() => {
    if (!showHint || !flat) return
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault()
        setTipIndex((p) =>
          e.key === "ArrowUp" ? (p - 1 + 2) % 2 : (p + 1) % 2
        )
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showHint, flat])

  return (
    <Card
      id={`phrase-card-${phrase.id}`}
      style={
        flat ? { borderTopLeftRadius: 0, borderTopRightRadius: 0 } : undefined
      }
      className={cn(
        flat ? "min-h-0 flex-1 shadow-none ring-0 dark:ring-0" : "min-h-72",
        className
      )}
    >
      <CardHeader className="gap-2">
        {!flat && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
              {phrase.speaker.charAt(0)}
            </span>
            <span className="font-medium text-foreground">
              {phrase.speaker}
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {String(phrase.id).padStart(2, "0")}
            </span>
            <div className="ml-auto flex items-center gap-2">
              {nav?.label && (
                <span className="text-xs tabular-nums">{nav.label}</span>
              )}
              {reveal.canPeekHint && (
                <button
                  type="button"
                  onClick={() => setPeeked((p) => !p)}
                  className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  aria-label={peeked ? "Hide hint" : "Show hint"}
                >
                  <EyeIcon className="h-3 w-3" />
                  {peeked ? "Hide" : "Hint"}
                </button>
              )}
            </div>
          </div>
        )}
        <div className={cn(flat && "flex items-start gap-2")}>
          {reveal.showText ? (
            <p className={cn("text-lg leading-relaxed", flat && "flex-1")}>
              {phrase.text}
            </p>
          ) : (
            <p
              className={cn(
                "text-lg text-muted-foreground italic",
                flat && "flex-1"
              )}
            >
              Listen and repeat — the text appears after your attempt.
            </p>
          )}
          {flat && reveal.canPeekHint && (
            <button
              type="button"
              onClick={() => setPeeked((p) => !p)}
              className="mt-1.5 flex flex-none items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              aria-label={peeked ? "Hide hint" : "Show hint"}
            >
              <EyeIcon className="h-3 w-3" />
              {peeked ? "Hide" : "Hint"}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          flat ? "flex min-h-0 flex-1 flex-col gap-3" : "space-y-3"
        )}
      >
        {/* Non-flat: tip at top (existing dot nav) */}
        {!flat && showHint && (
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

        {/* Flat: spacer pushes tip box to bottom; nav lives in the footer row */}
        {flat && <div className="min-h-0 flex-1" />}

        {flat && showHint && (
          <div className="rounded-md bg-muted px-3 py-2.5 text-sm">
            <p className="mb-1 text-xs font-semibold text-foreground">
              {tipIndex === 0 ? "Phonetic tip" : "Technique tip"}
            </p>
            <p className="leading-relaxed text-muted-foreground">
              {tipIndex === 0 ? phrase.pronunciationHint : extraTip}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          flat
            ? "mt-auto flex flex-nowrap items-center gap-2"
            : "flex flex-wrap gap-2",
        )}
      >
        {nav && (
          <Button
            variant="ghost"
            size="icon"
            onClick={nav.onPrev}
            disabled={nav.prevDisabled}
            aria-label="Previous phrase"
          >
            <ChevronLeftIcon />
          </Button>
        )}
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
        {nav && (
          <Button
            variant="ghost"
            size="icon"
            onClick={nav.onNext}
            disabled={nav.nextDisabled}
            aria-label="Next phrase"
          >
            <ChevronRightIcon />
          </Button>
        )}
        {/* Tip nav: horizontal cluster in footer, only in flat mode when hint visible */}
        {flat && showHint && (
          <div className="flex flex-none items-center">
            <button
              type="button"
              onClick={() => setTipIndex((p) => (p - 1 + 2) % 2)}
              className="flex h-8 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Previous tip (↑)"
            >
              <ChevronUpIcon className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-[10px] tabular-nums text-muted-foreground/60">
              {tipIndex + 1}/2
            </span>
            <button
              type="button"
              onClick={() => setTipIndex((p) => (p + 1) % 2)}
              className="flex h-8 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Next tip (↓)"
            >
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {isRecording && (
          <span
            className={cn(
              "text-sm font-medium text-destructive",
              flat ? "sr-only" : "self-center",
            )}
            aria-live="polite"
          >
            Listening…
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
