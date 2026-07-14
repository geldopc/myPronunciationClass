declare global {
  interface Window {
    YT: {
      Player: new (
        elementOrId: string | HTMLElement,
        options: {
          videoId?: string
          playerVars?: Record<string, string | number>
          events?: {
            onReady?: (event: { target: YT.Player }) => void
            onError?: (event: { data: number }) => void
          }
        }
      ) => YT.Player
    }
    onYouTubeIframeAPIReady?: () => void
  }

  namespace YT {
    interface Player {
      playVideo(): void
      pauseVideo(): void
      seekTo(seconds: number, allowSeekAhead: boolean): void
      getCurrentTime(): number
      destroy(): void
    }
  }
}

export {}
