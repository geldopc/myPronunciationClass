import { useEffect, useRef, useState } from "react"

export function useAudioPlayer(playbackRate: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playingId, setPlayingId] = useState<number | null>(null)

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [])

  async function play(id: number, src: string) {
    audioRef.current?.pause()

    const audio = new Audio(import.meta.env.BASE_URL + src.replace(/^\//, ""))
    audioRef.current = audio
    audio.playbackRate = playbackRate
    audio.onended = () => setPlayingId(null)
    audio.onerror = () => setPlayingId(null)

    try {
      setPlayingId(id)
      await audio.play()
    } catch {
      setPlayingId(null)
    }
  }

  function stop() {
    audioRef.current?.pause()
    setPlayingId(null)
  }

  return { playingId, play, stop }
}
