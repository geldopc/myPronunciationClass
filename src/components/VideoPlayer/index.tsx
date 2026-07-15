import { useEffect } from "react"
import type { Phrase } from "@/lib/phrases"

type VideoPlayerProps = {
  phrase: Phrase
  isActive: boolean
  onPause: () => void
}

export function VideoPlayer({ phrase, isActive, onPause }: VideoPlayerProps) {
  // Pause when the phrase changes (navigating without clicking Ouvir)
  useEffect(() => {
    onPause()
  }, [phrase.id, onPause])

  // Pause when switching away from video mode
  useEffect(() => {
    if (!isActive) onPause()
  }, [isActive, onPause])

  return (
    <div
      id="video-player"
      className={!isActive ? "hidden" : "mx-auto mb-4 w-full max-w-xl"}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <div id="yt-player" className="absolute inset-0" />
        {/* Blocks YouTube's share button, suggestions overlay, and logo link */}
        <div className="absolute inset-0 z-10" />
      </div>
      <p className="mt-1 text-center text-xs text-muted-foreground">
        {phrase.speaker} — phrase {phrase.id}
      </p>
    </div>
  )
}
