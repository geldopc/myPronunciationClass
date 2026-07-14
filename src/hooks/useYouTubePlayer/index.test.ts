// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useYouTubePlayer } from "@/hooks/useYouTubePlayer"

let mockSeekTo: ReturnType<typeof vi.fn>
let mockPlayVideo: ReturnType<typeof vi.fn>
let mockPauseVideo: ReturnType<typeof vi.fn>
let mockGetCurrentTime: ReturnType<typeof vi.fn>
let mockDestroy: ReturnType<typeof vi.fn>

beforeEach(() => {
  mockSeekTo = vi.fn()
  mockPlayVideo = vi.fn()
  mockPauseVideo = vi.fn()
  mockGetCurrentTime = vi.fn().mockReturnValue(0)
  mockDestroy = vi.fn()

  vi.stubGlobal("requestAnimationFrame", (_cb: FrameRequestCallback) => 0)
  vi.stubGlobal("cancelAnimationFrame", vi.fn())

  const player = {
    seekTo: mockSeekTo,
    playVideo: mockPlayVideo,
    pauseVideo: mockPauseVideo,
    getCurrentTime: mockGetCurrentTime,
    destroy: mockDestroy,
  }

  vi.stubGlobal("YT", {
    Player: vi.fn().mockImplementation(
      function (_id: string, opts: { events?: { onReady?: (e: object) => void } }) {
        opts.events?.onReady?.({})
        return player
      }
    ),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("useYouTubePlayer", () => {
  it("reports ready after player initialises", () => {
    const { result } = renderHook(() => useYouTubePlayer("yt-container"))
    expect(result.current.ready).toBe(true)
  })

  it("playSegment calls seekTo then playVideo", () => {
    const { result } = renderHook(() => useYouTubePlayer("yt-container"))
    act(() => result.current.playSegment(10, 20))
    expect(mockSeekTo).toHaveBeenCalledWith(10, true)
    expect(mockPlayVideo).toHaveBeenCalled()
  })

  it("playSegment pauses when getCurrentTime reaches endTime", () => {
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => { cb(0); return 0 })
    mockGetCurrentTime.mockReturnValue(20.1)
    const { result } = renderHook(() => useYouTubePlayer("yt-container"))
    act(() => result.current.playSegment(10, 20))
    expect(mockPauseVideo).toHaveBeenCalled()
  })

  it("pause calls pauseVideo", () => {
    const { result } = renderHook(() => useYouTubePlayer("yt-container"))
    act(() => result.current.pause())
    expect(mockPauseVideo).toHaveBeenCalled()
  })

  it("destroys player on unmount", () => {
    const { unmount } = renderHook(() => useYouTubePlayer("yt-container"))
    unmount()
    expect(mockDestroy).toHaveBeenCalled()
  })
})
