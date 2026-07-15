// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { VideoPlayer } from "@/components/VideoPlayer"
import type { Phrase } from "@/lib/phrases"

afterEach(cleanup)

const phrase: Phrase = {
  id: 1,
  text: "Hello there friend",
  audioSrc: "/audios/frase1.mp3",
  pronunciationHint: "Say it clearly",
  speaker: "Joey",
  startTime: 0,
  endTime: 8.395,
}

const phrase2: Phrase = { ...phrase, id: 2 }

describe("VideoPlayer", () => {
  it("hides the player container when isActive is false", () => {
    render(<VideoPlayer phrase={phrase} isActive={false} onPause={vi.fn()} />)
    const el = document.getElementById("video-player")
    expect(el).not.toBeNull()
    expect(el?.classList.contains("hidden")).toBe(true)
  })

  it("renders the player container when isActive is true", () => {
    render(<VideoPlayer phrase={phrase} isActive={true} onPause={vi.fn()} />)
    expect(document.getElementById("video-player")).not.toBeNull()
  })

  it("renders the yt-player div for the IFrame API to target", () => {
    render(<VideoPlayer phrase={phrase} isActive={true} onPause={vi.fn()} />)
    expect(document.getElementById("yt-player")).not.toBeNull()
  })

  it("calls onPause when switching to inactive", () => {
    const onPause = vi.fn()
    const { rerender } = render(
      <VideoPlayer phrase={phrase} isActive={true} onPause={onPause} />
    )
    onPause.mockClear()
    rerender(<VideoPlayer phrase={phrase} isActive={false} onPause={onPause} />)
    expect(onPause).toHaveBeenCalled()
  })

  it("calls onPause when the phrase changes", () => {
    const onPause = vi.fn()
    const { rerender } = render(
      <VideoPlayer phrase={phrase} isActive={true} onPause={onPause} />
    )
    onPause.mockClear()
    rerender(<VideoPlayer phrase={phrase2} isActive={true} onPause={onPause} />)
    expect(onPause).toHaveBeenCalled()
  })
})
