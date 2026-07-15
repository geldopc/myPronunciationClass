import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PhraseCard } from "@/components/PhraseCard"
import { SpineNode } from "@/components/PhraseList/SpineNode"
import type { SpineNodeState } from "@/components/PhraseList/SpineNode"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import type { Difficulty } from "@/lib/difficulty"
import type { Phrase } from "@/lib/phrases"

type PhraseListProps = {
  phrases: Phrase[]
  difficulty: Difficulty
  focusMode: boolean
  currentPhraseId: number
  onCurrentPhraseChange: (phraseId: number) => void
  playingId: number | null
  recordingPhraseId: number | null
  supportsSpeechRecognition: boolean
  evaluations: Record<number, SpeechEvaluation>
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
  registerToggle: (phraseId: number, toggle: (() => void) | null) => void
}

function getNodeState(
  phrase: Phrase,
  currentPhraseId: number,
  evaluations: Record<number, SpeechEvaluation>
): SpineNodeState {
  if (phrase.id in evaluations) return "done"
  if (phrase.id === currentPhraseId) return "current"
  return "untouched"
}

export function PhraseList(props: PhraseListProps) {
  const {
    phrases,
    difficulty,
    focusMode,
    currentPhraseId,
    onCurrentPhraseChange,
    playingId,
    recordingPhraseId,
    supportsSpeechRecognition,
    evaluations,
    onPlay,
    onRecordingChange,
    onEvaluation,
    registerToggle,
  } = props

  function cardPropsFor(phrase: Phrase) {
    return {
      phrase,
      difficulty,
      isPlaying: playingId === phrase.id,
      isAnyPhrasePlaying: playingId !== null,
      isAnyPhraseRecording: recordingPhraseId !== null,
      isAnotherPhraseRecording:
        recordingPhraseId !== null && recordingPhraseId !== phrase.id,
      supportsSpeechRecognition,
      evaluation: evaluations[phrase.id],
      onPlay,
      onRecordingChange,
      onEvaluation,
      registerToggle,
    }
  }

  if (focusMode) {
    const index = Math.max(
      phrases.findIndex((phrase) => phrase.id === currentPhraseId),
      0
    )
    const phrase = phrases[index]

    return (
      <section
        id="phrase-list"
        aria-label="Current phrase"
        className="mx-auto max-w-xl space-y-4"
      >
        <PhraseCard {...cardPropsFor(phrase)} />
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={index <= 0}
            onClick={() => onCurrentPhraseChange(phrases[index - 1].id)}
          >
            <ChevronLeftIcon /> Previous
          </Button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {index + 1} / {phrases.length}
          </span>
          <Button
            variant="ghost"
            disabled={index >= phrases.length - 1}
            onClick={() => onCurrentPhraseChange(phrases[index + 1].id)}
          >
            Next <ChevronRightIcon />
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section
      id="phrase-list"
      aria-label="Phrases to practice"
      className="space-y-4"
    >
      {phrases.map((phrase, index) => (
        <div key={phrase.id} className="flex gap-4">
          <div className="flex flex-col items-center pt-6">
            <SpineNode
              phraseId={phrase.id}
              state={getNodeState(phrase, currentPhraseId, evaluations)}
            />
            {index < phrases.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-border" aria-hidden />
            )}
          </div>
          <div className="flex-1 pb-2">
            <PhraseCard {...cardPropsFor(phrase)} />
          </div>
        </div>
      ))}
    </section>
  )
}
