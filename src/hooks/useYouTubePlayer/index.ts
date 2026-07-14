import { useEffect, useRef, useState } from "react"

import { SOURCE_VIDEO_ID } from "@/lib/phrases"

let apiScriptAdded = false

function loadYouTubeApi() {
  if (apiScriptAdded) return
  apiScriptAdded = true
  const tag = document.createElement("script")
  tag.src = "https://www.youtube.com/iframe_api"
  document.head.appendChild(tag)
}

export function useYouTubePlayer(
  containerId: string,
  onError?: () => void
): { playSegment: (start: number, end: number) => void; pause: () => void; ready: boolean } {
  const playerRef = useRef<YT.Player | null>(null)
  const rafRef = useRef<number>(0)
  const endTimeRef = useRef<number>(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    function initPlayer() {
      playerRef.current = new window.YT.Player(containerId, {
        videoId: SOURCE_VIDEO_ID,
        playerVars: { rel: 0, modestbranding: 1, controls: 1 },
        events: {
          onReady: () => setReady(true),
          onError: () => onError?.(),
        },
      })
    }

    if (typeof window.YT !== "undefined" && window.YT.Player) {
      initPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }
      loadYouTubeApi()
    }

    return () => {
      cancelAnimationFrame(rafRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [containerId])

  function playSegment(startTime: number, endTime: number) {
    if (!playerRef.current) return
    endTimeRef.current = endTime
    playerRef.current.seekTo(startTime, true)
    playerRef.current.playVideo()

    function poll() {
      if (!playerRef.current) return
      if (playerRef.current.getCurrentTime() >= endTimeRef.current) {
        playerRef.current.pauseVideo()
        return
      }
      rafRef.current = requestAnimationFrame(poll)
    }
    poll()
  }

  function pause() {
    cancelAnimationFrame(rafRef.current)
    playerRef.current?.pauseVideo()
  }

  return { playSegment, pause, ready }
}
