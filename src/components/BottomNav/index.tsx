import { ListIcon, Maximize2Icon, VideoIcon } from "lucide-react"

import { DifficultyToggle } from "@/components/TopBar/DifficultyToggle"
import { SpeedControl } from "@/components/TopBar/SpeedControl"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/difficulty"

type BottomNavProps = {
  difficulty: Difficulty
  onDifficultyChange: (value: Difficulty) => void
  playbackRate: PlaybackRate
  onPlaybackRateChange: (value: PlaybackRate) => void
  focusMode: boolean
  onFocusModeChange: (value: boolean) => void
  playerMode: "audio" | "video"
  onPlayerModeChange: (mode: "audio" | "video") => void
  completedCount: number
  total: number
}

export function BottomNav({
  difficulty,
  onDifficultyChange,
  playbackRate,
  onPlaybackRateChange,
  focusMode,
  onFocusModeChange,
  playerMode,
  onPlayerModeChange,
  completedCount,
  total,
}: BottomNavProps) {
  const pct = total ? (completedCount / total) * 100 : 0

  return (
    <nav
      id="bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div className="container mx-auto flex max-w-3xl items-center gap-3 px-4 py-2">
        {/* Left: difficulty */}
        <DifficultyToggle value={difficulty} onChange={onDifficultyChange} />

        {/* Center: progress bar with numbers inside */}
        <div
          className="relative flex h-7 flex-1 items-center overflow-hidden rounded-full bg-muted"
          aria-label={`${completedCount} of ${total} phrases done`}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary/80 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
          <span className="relative w-full text-center text-xs font-medium tabular-nums mix-blend-difference">
            {completedCount} / {total}
          </span>
        </div>

        {/* Right: speed + 3-state mode selector */}
        <div className="flex items-center gap-1">
          <SpeedControl
            value={playbackRate}
            onChange={onPlaybackRateChange}
            className="h-8 w-[4.5rem]"
          />

          <div className="flex rounded-md border border-border/60">
            <Button
              type="button"
              variant={!focusMode ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-r-none"
              aria-label="List mode"
              aria-pressed={!focusMode}
              onClick={() => onFocusModeChange(false)}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={
                focusMode && playerMode === "audio" ? "secondary" : "ghost"
              }
              size="icon"
              className="h-8 w-8 rounded-none border-x border-border/60"
              aria-label="Focus mode"
              aria-pressed={focusMode && playerMode === "audio"}
              onClick={() => {
                onFocusModeChange(true)
                onPlayerModeChange("audio")
              }}
            >
              <Maximize2Icon className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={
                focusMode && playerMode === "video" ? "secondary" : "ghost"
              }
              size="icon"
              className="h-8 w-8 rounded-l-none"
              aria-label="Video mode"
              aria-pressed={focusMode && playerMode === "video"}
              onClick={() => {
                onFocusModeChange(true)
                onPlayerModeChange("video")
              }}
            >
              <VideoIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
