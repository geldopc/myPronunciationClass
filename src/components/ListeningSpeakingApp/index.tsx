import { useCallback, useEffect, useRef, useState } from "react"

import { BottomNav } from "@/components/BottomNav"
import { Galaxy } from "@/components/Galaxy"
import { ShapeGrid } from "@/components/ShapeGrid"
import { PhraseList } from "@/components/PhraseList"
import { TopBar } from "@/components/TopBar"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { VideoPlayer } from "@/components/VideoPlayer"
import { useAudioPlayer } from "@/hooks/useAudioPlayer"
import { useProgress } from "@/hooks/useProgress"
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer"
import type { SpeechEvaluation } from "@/hooks/useSpeechRecognition"
import type { Difficulty } from "@/lib/difficulty"
import { phrases } from "@/lib/phrases"
import type { Phrase } from "@/lib/phrases"
import { cn } from "@/lib/utils"
import { useAuth } from "@/providers/Auth"
import { useTheme } from "@/providers/Theme"

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

  const { theme } = useTheme()
  const isDark = theme === "dark"

  const { user } = useAuth()
  const { recordEvaluation } = useProgress()
  const adoptedRef = useRef(false)

  const { playingId, play, stop } = useAudioPlayer(playbackRate)
  const [videoPlayingId, setVideoPlayingId] = useState<number | null>(null)
  const toggleRegistry = useRef(new Map<number, () => void>())

  const handleVideoError = useCallback(() => setPlayerMode("audio"), [])
  const handleVideoSegmentEnd = useCallback(() => setVideoPlayingId(null), [])
  const { playSegment, pause, setRate } = useYouTubePlayer(
    "yt-player",
    handleVideoError,
    handleVideoSegmentEnd
  )

  const handleVideoPause = useCallback(() => {
    pause()
    setVideoPlayingId(null)
  }, [pause])

  useEffect(() => {
    setRate(playbackRate)
  }, [playbackRate, setRate])

  useEffect(() => {
    setSupportsSpeechRecognition(
      Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition)
    )
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("playerMode", playerMode)
    } catch {
      // localStorage unavailable
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
        if (playingId === phrase.id) {
          stop()
        } else {
          play(phrase.id, phrase.audioSrc)
        }
      } else {
        if (videoPlayingId === phrase.id) {
          handleVideoPause()
        } else {
          playSegment(phrase.startTime, phrase.endTime)
          setVideoPlayingId(phrase.id)
        }
      }
    },
    [
      recordingPhraseId,
      playerMode,
      playingId,
      videoPlayingId,
      play,
      stop,
      playSegment,
      handleVideoPause,
    ]
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
  const currentPhrase =
    phrases.find((p) => p.id === currentPhraseId) ?? phrases[0]
  const effectivePlayingId = playingId ?? videoPlayingId
  const isVideoMode = playerMode === "video" && focusMode

  return (
    <div id="listening-speaking-app" className="relative min-h-screen">
      {/* Background — fixed, behind all content */}
      <div
        className={`fixed inset-0 -z-10 ${isDark ? "bg-zinc-950" : "bg-white"}`}
      >
        {difficulty === "hard" &&
          (isDark ? (
            <Galaxy
              mouseInteraction
              mouseRepulsion
              saturation={0.25}
              hueShift={220}
              glowIntensity={0.4}
              twinkleIntensity={0.35}
              rotationSpeed={0.06}
              density={1.2}
            />
          ) : (
            <ShapeGrid
              direction="diagonal"
              speed={0.3}
              borderColor="#e2e8f0"
              hoverFillColor="#f1f5f9"
              squareSize={50}
              shape="square"
              hoverTrailAmount={4}
            />
          ))}
      </div>

      <TopBar />

      <main
        className="container mx-auto flex max-w-3xl flex-col overflow-hidden px-4 pt-4"
        style={{
          height: "calc(100dvh - 60px)",
          paddingBottom: "max(96px, calc(56px + env(safe-area-inset-bottom)))",
        }}
      >
        {/* Unified wrapper: in video+focus mode this div becomes the card surface
            (rounded, shadow, bg-card) so VideoPlayer and PhraseCard share one panel.
            VideoPlayer is always mounted to keep #yt-player in the DOM. */}
        <div
          className={cn(
            "flex min-h-0 flex-col",
            isVideoMode &&
              "flex-1 overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10",
          )}
        >
          <VideoPlayer
            phrase={currentPhrase}
            isActive={isVideoMode}
            unified={isVideoMode}
            onPause={handleVideoPause}
          />
          <PhraseList
            phrases={phrases}
            difficulty={difficulty}
            focusMode={focusMode}
            currentPhraseId={currentPhraseId}
            onCurrentPhraseChange={setCurrentPhraseId}
            playingId={effectivePlayingId}
            recordingPhraseId={recordingPhraseId}
            supportsSpeechRecognition={supportsSpeechRecognition}
            evaluations={evaluations}
            videoMode={isVideoMode}
            onPlay={handlePlay}
            onRecordingChange={handleRecordingChange}
            onEvaluation={saveEvaluation}
            registerToggle={registerToggle}
          />
        </div>
      </main>

      <BottomNav
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        playbackRate={playbackRate}
        onPlaybackRateChange={setPlaybackRate}
        focusMode={focusMode}
        onFocusModeChange={setFocusMode}
        playerMode={playerMode}
        onPlayerModeChange={(mode) => {
          setPlayerMode(mode)
          if (mode === "audio") handleVideoPause()
        }}
        completedCount={completedCount}
        total={phrases.length}
      />
    </div>
  )
}
