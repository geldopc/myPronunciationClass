// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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

let mockSeekTo: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockSeekTo = vi.fn()

  vi.stubGlobal("requestAnimationFrame", vi.fn())
  vi.stubGlobal("cancelAnimationFrame", vi.fn())

  const seekTo = mockSeekTo

  class MockYTPlayer {
    seekTo = seekTo
    playVideo = vi.fn()
    pauseVideo = vi.fn()
    getCurrentTime = vi.fn().mockReturnValue(0)
    destroy = vi.fn()

    constructor(_id: string, opts?: { events?: { onReady?: (e: object) => void } }) {
      opts?.events?.onReady?.({})
    }
  }

  vi.stubGlobal("YT", {
    Player: MockYTPlayer,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("VideoPlayer", () => {
  it("hides the player container when isActive is false", () => {
    render(<VideoPlayer phrase={phrase} isActive={false} />)
    const el = document.getElementById("video-player")
    expect(el).not.toBeNull()
    expect(el?.classList.contains("hidden")).toBe(true)
  })

  it("renders the player container when isActive is true", () => {
    render(<VideoPlayer phrase={phrase} isActive={true} />)
    expect(document.getElementById("video-player")).not.toBeNull()
  })

  it("renders the yt-player div for the IFrame API to target", () => {
    render(<VideoPlayer phrase={phrase} isActive={true} />)
    expect(document.getElementById("yt-player")).not.toBeNull()
  })

  it("isActive false→true transition triggers playSegment", () => {
    const { rerender } = render(<VideoPlayer phrase={phrase} isActive={false} />)
    // #yt-player is always in DOM even when hidden
    expect(document.getElementById("yt-player")).not.toBeNull()
    rerender(<VideoPlayer phrase={phrase} isActive={true} />)
    expect(mockSeekTo).toHaveBeenCalled()
  })
})
