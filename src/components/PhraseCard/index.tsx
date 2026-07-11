import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { isPhraseReady } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"
import { getSimilarityPercentage } from "@/lib/text-similarity"

export type SpeechEvaluation = {
  transcript: string
  score: number
}

type PhraseCardProps = {
  phrase: Phrase
  isPlaying: boolean
  isAnotherPhraseRecording: boolean
  isAnyPhrasePlaying: boolean
  isAnyPhraseRecording: boolean
  supportsSpeechRecognition: boolean
  evaluation?: SpeechEvaluation
  onPlay: (phrase: Phrase) => void
  onRecordingChange: (phraseId: number | null) => void
  onEvaluation: (phraseId: number, evaluation: SpeechEvaluation) => void
}

const recognitionErrorMessages: Record<string, string> = {
  "audio-capture": "Nenhum microfone foi encontrado.",
  "not-allowed": "Permita o uso do microfone no navegador.",
  "service-not-allowed": "O serviço de reconhecimento não está disponível.",
  network: "Não foi possível acessar o serviço de reconhecimento.",
  "no-speech": "Não foi detectada fala. Tente novamente.",
}

export function PhraseCard({
  phrase,
  isPlaying,
  isAnotherPhraseRecording,
  isAnyPhrasePlaying,
  isAnyPhraseRecording,
  supportsSpeechRecognition,
  evaluation,
  onPlay,
  onRecordingChange,
  onEvaluation,
}: PhraseCardProps) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const phraseReady = isPhraseReady(phrase)

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  function finishRecording() {
    setIsRecording(false)
    onRecordingChange(null)
  }

  function startRecording() {
    if (!supportsSpeechRecognition || !phraseReady) return
    if (isAnyPhrasePlaying) return

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition

    if (!SpeechRecognitionApi) return

    setRecordingError(null)
    const recognition = new SpeechRecognitionApi()
    recognitionRef.current = recognition
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      // State is set before `start` too, so a second click cannot create a
      // concurrent recognition instance while the browser opens its prompt.
      setIsRecording(true)
      onRecordingChange(phrase.id)
    }

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      const transcript = lastResult[0].transcript.trim()

      onEvaluation(phrase.id, {
        transcript,
        score: getSimilarityPercentage(phrase.text, transcript),
      })
    }

    recognition.onerror = (event) => {
      setRecordingError(
        recognitionErrorMessages[event.error] ??
          "Não foi possível reconhecer a fala."
      )
    }

    recognition.onend = finishRecording

    try {
      setIsRecording(true)
      onRecordingChange(phrase.id)
      recognition.start()
    } catch {
      setRecordingError("A gravação já está sendo iniciada. Tente novamente.")
      finishRecording()
    }
  }

  function toggleRecording() {
    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    startRecording()
  }

  const scoreTone =
    evaluation && evaluation.score >= 80
      ? "border-primary/50 bg-primary/5"
      : evaluation && evaluation.score >= 50
        ? "border-border bg-muted/50"
        : evaluation
          ? "border-destructive/50 bg-destructive/5"
          : ""

  const scoreTextTone =
    evaluation && evaluation.score >= 80
      ? "text-primary"
      : evaluation && evaluation.score >= 50
        ? "text-foreground"
        : "text-destructive"

  return (
    <Card id={`phrase-card-${phrase.id}`} className={scoreTone}>
      <CardHeader className="gap-2">
        <CardDescription>Frase {phrase.id}</CardDescription>
        <CardTitle className="text-lg leading-relaxed">{phrase.text}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            Dica de pronúncia:{" "}
          </span>
          {phrase.pronunciationHint}
        </div>

        {evaluation && (
          <div className="space-y-1 rounded-md border border-border p-3 text-sm">
            <p className="text-muted-foreground">Você disse</p>
            <p className="font-medium">&ldquo;{evaluation.transcript}&rdquo;</p>
            <p className={`font-semibold ${scoreTextTone}`}>
              Acerto: {evaluation.score}%
            </p>
          </div>
        )}

        {recordingError && (
          <p className="text-sm text-destructive">{recordingError}</p>
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
          {isPlaying ? "Tocando..." : "Play"}
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
          {isRecording ? "Parar gravação" : "Gravar / Repetir"}
        </Button>
        {isRecording && (
          <span className="self-center text-sm font-medium text-destructive">
            Gravando...
          </span>
        )}
      </CardFooter>
    </Card>
  )
}
