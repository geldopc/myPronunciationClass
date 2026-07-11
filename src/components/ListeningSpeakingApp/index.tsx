import { useEffect, useRef, useState } from "react"

import { PhraseCard } from "@/components/PhraseCard"
import type { SpeechEvaluation } from "@/components/PhraseCard"
import { phrases } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const playbackRates = [0.5, 0.75, 1, 1.25, 1.5] as const

export function ListeningSpeakingApp() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playbackRate, setPlaybackRate] =
    useState<(typeof playbackRates)[number]>(1)
  const [playingPhraseId, setPlayingPhraseId] = useState<number | null>(null)
  const [recordingPhraseId, setRecordingPhraseId] = useState<number | null>(
    null
  )
  const [evaluations, setEvaluations] = useState<
    Record<number, SpeechEvaluation>
  >({})
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] =
    useState(false)

  useEffect(() => {
    setSupportsSpeechRecognition(
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
    )

    return () => {
      audioRef.current?.pause()
    }
  }, [])

  function handlePlaybackRateChange(value: string) {
    const nextRate = Number(value) as (typeof playbackRates)[number]
    setPlaybackRate(nextRate)

    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate
    }
  }

  async function playPhrase(phrase: Phrase) {
    if (recordingPhraseId !== null) return

    audioRef.current?.pause()

    const audio = new Audio(phrase.audioSrc)
    audioRef.current = audio
    audio.playbackRate = playbackRate
    audio.onended = () => setPlayingPhraseId(null)
    audio.onerror = () => setPlayingPhraseId(null)

    try {
      setPlayingPhraseId(phrase.id)
      await audio.play()
    } catch {
      setPlayingPhraseId(null)
    }
  }

  function saveEvaluation(phraseId: number, evaluation: SpeechEvaluation) {
    setEvaluations((currentEvaluations) => ({
      ...currentEvaluations,
      [phraseId]: evaluation,
    }))
  }

  const isAnyPhrasePlaying = playingPhraseId !== null
  const isAnyPhraseRecording = recordingPhraseId !== null

  return (
    <main
      id="listening-speaking-app"
      className="container mx-auto max-w-4xl px-4 py-10"
    >
      <header className="mb-8 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary">
            Listening & Speaking
          </p>
          <h1 className="text-3xl font-bold tracking-tight">
            Pratique cada fala
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Ouça a frase, repita em voz alta e confira a transcrição e seu
            percentual de acerto.
          </p>
        </div>

        <div className="w-full max-w-48 space-y-2">
          <label htmlFor="playback-rate" className="text-sm font-medium">
            Velocidade do áudio
          </label>
          <Select
            value={String(playbackRate)}
            onValueChange={handlePlaybackRateChange}
          >
            <SelectTrigger id="playback-rate" aria-label="Velocidade do áudio">
              <SelectValue placeholder="Velocidade" />
            </SelectTrigger>
            <SelectContent>
              {playbackRates.map((rate) => (
                <SelectItem key={rate} value={String(rate)}>
                  {rate.toFixed(rate % 1 === 0 ? 1 : 2)}x
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <section
        id="phrase-list"
        aria-label="Frases para praticar"
        className="grid gap-4 md:grid-cols-2"
      >
        {phrases.map((phrase) => (
          <PhraseCard
            key={phrase.id}
            phrase={phrase}
            isPlaying={playingPhraseId === phrase.id}
            isAnotherPhraseRecording={
              recordingPhraseId !== null && recordingPhraseId !== phrase.id
            }
            isAnyPhrasePlaying={isAnyPhrasePlaying}
            isAnyPhraseRecording={isAnyPhraseRecording}
            supportsSpeechRecognition={supportsSpeechRecognition}
            evaluation={evaluations[phrase.id]}
            onPlay={playPhrase}
            onRecordingChange={setRecordingPhraseId}
            onEvaluation={saveEvaluation}
          />
        ))}
      </section>
    </main>
  )
}
