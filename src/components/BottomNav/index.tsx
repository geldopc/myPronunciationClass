import { Link } from "@tanstack/react-router"
import { ListIcon, Maximize2Icon, VideoIcon, Volume2Icon } from "lucide-react"

import { AuthControl } from "@/components/TopBar/AuthControl"
import { DifficultyToggle } from "@/components/TopBar/DifficultyToggle"
import { SpeedControl } from "@/components/TopBar/SpeedControl"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { ThemeToggle } from "@/components/TopBar/ThemeToggle"
import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/difficulty"

type BottomNavProps = {
  difficulty: Difficulty
  onDifficultyChange: (value: Difficulty) => void
  playbackRate: PlaybackRate
  onPlaybackRateChange: (value: PlaybackRate) => void
  focusMode: boolean
  onToggleFocusMode: () => void
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
  onToggleFocusMode,
  playerMode,
  onPlayerModeChange,
  completedCount,
  total,
}: BottomNavProps) {
  return (
    <nav
      id="bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/40 bg-background/60 backdrop-blur-xl"
    >
      <div className="container mx-auto flex max-w-3xl items-center justify-between gap-2 px-4 py-2">
        <DifficultyToggle value={difficulty} onChange={onDifficultyChange} />

        <div className="flex items-center gap-1">
          <SpeedControl value={playbackRate} onChange={onPlaybackRateChange} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={focusMode ? "Full list" : "Focus mode"}
            aria-pressed={focusMode}
            onClick={onToggleFocusMode}
          >
            {focusMode ? <ListIcon /> : <Maximize2Icon />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              playerMode === "video" ? "Switch to audio" : "Switch to video"
            }
            aria-pressed={playerMode === "video"}
            onClick={() =>
              onPlayerModeChange(playerMode === "video" ? "audio" : "video")
            }
          >
            {playerMode === "video" ? <Volume2Icon /> : <VideoIcon />}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/progress"
            className="tabular-nums text-xs text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Progress: ${completedCount} of ${total} phrases`}
          >
            {completedCount}/{total}
          </Link>
          <ThemeToggle />
          <AuthControl />
        </div>
      </div>
    </nav>
  )
}
