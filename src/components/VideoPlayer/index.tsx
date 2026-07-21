import { useEffect } from "react"
import type { Phrase } from "@/lib/phrases"

type VideoPlayerProps = {
  phrase: Phrase
  isActive: boolean
  /** When true, renders as part of a unified card panel — no outer margins,
   *  no inner rounding (parent provides rounded corners and surface). */
  unified?: boolean
  onPause: () => void
}

export function VideoPlayer({ phrase, isActive, unified = false, onPause }: VideoPlayerProps) {
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
      className={
        !isActive
          ? "hidden"
          : unified
            ? "w-full flex-none"
            : "mx-auto mb-2 w-full flex-none"
      }
      style={
        isActive
          ? {
              maxWidth: unified ? undefined : "min(100%, calc(30dvh * 16 / 9))",
              maxHeight: "30dvh",
            }
          : undefined
      }
    >
      <div
        className={`relative aspect-video w-full overflow-hidden${unified ? "" : " rounded-lg"}`}
      >
        <div id="yt-player" className="absolute inset-0" />
        {/* Blocks YouTube's share button, suggestions overlay, and logo link */}
        <div className="absolute inset-0 z-10" />
      </div>
    </div>
  )
}
