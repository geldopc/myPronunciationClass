import { useEffect, useRef, useState } from "react"

import { getSimilarityPercentage } from "@/lib/text-similarity"

export type SpeechEvaluation = {
  transcript: string
  score: number
}

const recognitionErrorMessages: Record<string, string> = {
  "audio-capture": "Nenhum microfone foi encontrado.",
  "not-allowed": "Permita o uso do microfone no navegador.",
  "service-not-allowed": "O serviço de reconhecimento não está disponível.",
  network: "Não foi possível acessar o serviço de reconhecimento.",
  "no-speech": "Não foi detectada fala. Tente novamente.",
}

type UseSpeechRecognitionOptions = {
  supported: boolean
  onEvaluation: (evaluation: SpeechEvaluation) => void
  onRecordingChange: (recording: boolean) => void
}

export function useSpeechRecognition({
  supported,
  onEvaluation,
  onRecordingChange,
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort()
    }
  }, [])

  function finish() {
    setIsRecording(false)
    onRecordingChange(false)
  }

  function start(targetText: string) {
    if (!supported) return

    const SpeechRecognitionApi =
      window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechRecognitionApi) return

    setError(null)
    const recognition = new SpeechRecognitionApi()
    recognitionRef.current = recognition
    recognition.lang = "en-US"
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsRecording(true)
      onRecordingChange(true)
    }

    recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      const transcript = lastResult[0].transcript.trim()

      onEvaluation({
        transcript,
        score: getSimilarityPercentage(targetText, transcript),
      })
    }

    recognition.onerror = (event) => {
      setError(
        recognitionErrorMessages[event.error] ??
          "Não foi possível reconhecer a fala."
      )
      finish()
    }

    recognition.onend = finish

    try {
      setIsRecording(true)
      onRecordingChange(true)
      recognition.start()
    } catch {
      setError("A gravação já está sendo iniciada. Tente novamente.")
      finish()
    }
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  return { isRecording, error, start, stop }
}
