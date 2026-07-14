import { ListIcon, Maximize2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { AuthControl } from "@/components/TopBar/AuthControl"
import { DifficultyToggle } from "@/components/TopBar/DifficultyToggle"
import { SpeedControl } from "@/components/TopBar/SpeedControl"
import type { PlaybackRate } from "@/components/TopBar/SpeedControl"
import { ThemeToggle } from "@/components/TopBar/ThemeToggle"
import type { Difficulty } from "@/lib/difficulty"

type TopBarProps = {
  difficulty: Difficulty
  onDifficultyChange: (value: Difficulty) => void
  playbackRate: PlaybackRate
  onPlaybackRateChange: (value: PlaybackRate) => void
  focusMode: boolean
  onToggleFocusMode: () => void
}

export function TopBar({
  difficulty,
  onDifficultyChange,
  playbackRate,
  onPlaybackRateChange,
  focusMode,
  onToggleFocusMode,
}: TopBarProps) {
  return (
    <header
      id="top-bar"
      className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur"
    >
      <div className="container mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Logo className="h-9 w-auto" />
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyToggle value={difficulty} onChange={onDifficultyChange} />
          <SpeedControl value={playbackRate} onChange={onPlaybackRateChange} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={focusMode ? "Ver lista completa" : "Modo foco"}
            aria-pressed={focusMode}
            onClick={onToggleFocusMode}
          >
            {focusMode ? <ListIcon /> : <Maximize2Icon />}
          </Button>
          <ThemeToggle />
          <AuthControl />
        </div>
      </div>
    </header>
  )
}
