import { useEffect } from "react"

import { useYouTubePlayer } from "@/hooks/useYouTubePlayer"
import type { Phrase } from "@/lib/phrases"

type VideoPlayerProps = {
  phrase: Phrase
  isActive: boolean
  onError?: () => void
}

export function VideoPlayer({ phrase, isActive, onError }: VideoPlayerProps) {
  const { playSegment, pause } = useYouTubePlayer("yt-player", onError)

  useEffect(() => {
    if (!isActive) {
      pause()
      return
    }
    playSegment(phrase.startTime, phrase.endTime)
  }, [phrase.id, isActive, playSegment, pause])

  if (!isActive) return null

  return (
    <div id="video-player" className="w-full">
      <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: "56.25%" }}>
        <div id="yt-player" className="absolute inset-0" />
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        {phrase.speaker} — frase {phrase.id}
      </p>
    </div>
  )
}
