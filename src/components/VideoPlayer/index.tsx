import { useEffect } from "react"
import type { Phrase } from "@/lib/phrases"
import { cn } from "@/lib/utils"

type VideoPlayerProps = {
  phrase: Phrase
  isActive: boolean
  /** When true, renders as part of a unified card panel — no outer margins,
   *  no inner rounding (parent provides rounded corners and surface). */
  unified?: boolean
  onPause: () => void
}

export function VideoPlayer({
  phrase,
  isActive,
  unified = false,
  onPause,
}: VideoPlayerProps) {
  useEffect(() => {
    onPause()
  }, [phrase.id, onPause])

  useEffect(() => {
    if (!isActive) onPause()
  }, [isActive, onPause])

  return (
    <div
      id="video-player"
      className={cn(
        !isActive && "hidden",
        isActive && unified && "mx-auto w-full flex-none overflow-hidden",
        isActive && !unified && "mx-auto mb-2 w-full flex-none"
      )}
      style={
        isActive
          ? unified
            ? { maxHeight: "45dvh" }
            : {
                maxWidth: "min(100%, calc(30dvh * 16 / 9))",
                maxHeight: "30dvh",
              }
          : undefined
      }
    >
      <div
        className={cn(
          "relative aspect-video w-full overflow-hidden",
          !unified && "rounded-lg"
        )}
      >
        <div id="yt-player" className="absolute inset-0" />
        {/* Blocks YouTube's share button, suggestions overlay, and logo link */}
        <div className="absolute inset-0 z-10" />
      </div>
    </div>
  )
}
