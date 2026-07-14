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

beforeEach(() => {
  vi.stubGlobal("requestAnimationFrame", vi.fn())
  vi.stubGlobal("cancelAnimationFrame", vi.fn())

  class MockYTPlayer {
    constructor(_id: string, opts?: { events?: { onReady?: (e: object) => void } }) {
      opts?.events?.onReady?.({})
    }
    seekTo = vi.fn()
    playVideo = vi.fn()
    pauseVideo = vi.fn()
    getCurrentTime = vi.fn().mockReturnValue(0)
    destroy = vi.fn()
  }

  vi.stubGlobal("YT", {
    Player: MockYTPlayer,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("VideoPlayer", () => {
  it("renders nothing when isActive is false", () => {
    render(<VideoPlayer phrase={phrase} isActive={false} />)
    expect(document.getElementById("video-player")).toBeNull()
  })

  it("renders the player container when isActive is true", () => {
    render(<VideoPlayer phrase={phrase} isActive={true} />)
    expect(document.getElementById("video-player")).not.toBeNull()
  })

  it("renders the yt-player div for the IFrame API to target", () => {
    render(<VideoPlayer phrase={phrase} isActive={true} />)
    expect(document.getElementById("yt-player")).not.toBeNull()
  })
})
