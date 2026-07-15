import { useCallback, useEffect, useRef, useState } from "react"

import { PhraseList } from "@/components/PhraseList"
import { TopBar } from "@/components/TopBar"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { useProgress } from "@/hooks/useProgress"
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import type { Difficulty } from "@/lib/difficulty"
import { phrases } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"
import { useAuth } from "@/providers/Auth"

export function ListeningSpeakingApp() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [focusMode, setFocusMode] = useState(true)
  const [playerMode, setPlayerMode] = useState<"audio" | "video">(() => {
    try {
      const stored = localStorage.getItem("playerMode")
      return stored === "video" ? "video" : "audio"
    } catch {
      return "audio"
    }
  })
  const [playbackRate, setPlaybackRate] = useState<PlaybackRate>(1)
  const [currentPhraseId, setCurrentPhraseId] = useState<number>(phrases[0].id)
  const [recordingPhraseId, setRecordingPhraseId] = useState<number | null>(
    null
  )
  const [evaluations, setEvaluations] = useState<
    Record<number, SpeechEvaluation>
  >({})
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] =
    useState(false)

  const { user } = useAuth()
  const { recordEvaluation } = useProgress()
  const adoptedRef = useRef(false)

  const { playingId, play } = useAudioPlayer(playbackRate)
  const toggleRegistry = useRef(new Map<number, () => void>())

  const handleVideoError = useCallback(() => setPlayerMode("audio"), [])
  const { playSegment, pause } = useYouTubePlayer("yt-player", handleVideoError)

  useEffect(() => {
    setSupportsSpeechRecognition(
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
    )
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("playerMode", playerMode)
    } catch {
      // localStorage unavailable (private browsing)
    }
  }, [playerMode])

  const registerToggle = useCallback(
    (phraseId: number, toggle: (() => void) | null) => {
      if (toggle) {
        toggleRegistry.current.set(phraseId, toggle)
      } else {
        toggleRegistry.current.delete(phraseId)
      }
    },
    []
  )

  const handlePlay = useCallback(
    (phrase: Phrase) => {
      if (recordingPhraseId !== null) return
      setCurrentPhraseId(phrase.id)
      if (playerMode === "audio") {
        play(phrase.id, phrase.audioSrc)
      } else {
        playSegment(phrase.startTime, phrase.endTime)
      }
    },
    [recordingPhraseId, playerMode, play, playSegment]
  )

  function handleRecordingChange(phraseId: number | null) {
    setRecordingPhraseId(phraseId)
    if (phraseId !== null) setCurrentPhraseId(phraseId)
  }

  function saveEvaluation(phraseId: number, evaluation: SpeechEvaluation) {
    setEvaluations((current) => ({ ...current, [phraseId]: evaluation }))
    void recordEvaluation(phraseId, difficulty, evaluation)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return
      }

      const index = phrases.findIndex((phrase) => phrase.id === currentPhraseId)
      const currentPhrase = phrases[index]

      if (event.code === "Space") {
        event.preventDefault()
        handlePlay(currentPhrase)
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault()
        toggleRegistry.current.get(currentPhraseId)?.()
      } else if (event.key === "ArrowLeft" && index > 0) {
        setCurrentPhraseId(phrases[index - 1].id)
      } else if (event.key === "ArrowRight" && index < phrases.length - 1) {
        setCurrentPhraseId(phrases[index + 1].id)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [currentPhraseId, handlePlay])

  useEffect(() => {
    if (!user || adoptedRef.current) return
    adoptedRef.current = true
    for (const [phraseId, evaluation] of Object.entries(evaluations)) {
      void recordEvaluation(Number(phraseId), difficulty, evaluation)
    }
  }, [user, evaluations, difficulty, recordEvaluation])

  const completedCount = Object.keys(evaluations).length

  return (
    <div id="listening-speaking-app" className="min-h-screen bg-background">
      <TopBar
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((value) => !value)}
        playerMode={playerMode}
        onPlayerModeChange={setPlayerMode}
        completedCount={completedCount}
        total={phrases.length}
      />

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <PhraseList
          phrases={phrases}
          difficulty={difficulty}
          focusMode={focusMode}
          currentPhraseId={currentPhraseId}
          onCurrentPhraseChange={setCurrentPhraseId}
          playingId={playingId}
          recordingPhraseId={recordingPhraseId}
          supportsSpeechRecognition={supportsSpeechRecognition}
          evaluations={evaluations}
          onPlay={handlePlay}
          onRecordingChange={handleRecordingChange}
          onEvaluation={saveEvaluation}
          registerToggle={registerToggle}
          playerMode={playerMode}
          onVideoPause={pause}
        />
      </main>
    </div>
  )
}
