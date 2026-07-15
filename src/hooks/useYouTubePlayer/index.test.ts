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

  const container = document.createElement("div")
  container.id = "yt-container"
  document.body.appendChild(container)

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
      function (_el: HTMLElement | string, opts: { events?: { onReady?: (e: object) => void } }) {
        opts.events?.onReady?.({})
        return player
      }
    ),
  })
})

afterEach(() => {
  document.getElementById("yt-container")?.remove()
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

  it("playSegment is a no-op before onReady fires", () => {
    const player = {
      seekTo: mockSeekTo,
      playVideo: mockPlayVideo,
      pauseVideo: mockPauseVideo,
      getCurrentTime: mockGetCurrentTime,
      destroy: mockDestroy,
    }
    vi.stubGlobal("YT", {
      Player: vi.fn().mockImplementation(
        function (_el: HTMLElement | string, _opts: object) {
          // deliberately do NOT call onReady
          return player
        }
      ),
    })
    const { result } = renderHook(() => useYouTubePlayer("yt-container"))
    act(() => result.current.playSegment(10, 20))
    expect(mockSeekTo).not.toHaveBeenCalled()
  })

  it("initPlayer is deferred until onYouTubeIframeAPIReady fires", () => {
    // Remove YT so the hook takes the async path
    vi.stubGlobal("YT", undefined)

    const { result } = renderHook(() => useYouTubePlayer("yt-container"))

    // Player not constructed yet — ready must still be false
    expect(result.current.ready).toBe(false)

    // Now make YT available and fire the deferred callback
    const player = {
      seekTo: mockSeekTo,
      playVideo: mockPlayVideo,
      pauseVideo: mockPauseVideo,
      getCurrentTime: mockGetCurrentTime,
      destroy: mockDestroy,
    }
    const MockPlayer = vi.fn().mockImplementation(
      function (_el: HTMLElement | string, opts: { events?: { onReady?: (e: object) => void } }) {
        opts.events?.onReady?.({})
        return player
      }
    )
    vi.stubGlobal("YT", { Player: MockPlayer })

    act(() => {
      ;(window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady?.()
    })

    expect(MockPlayer).toHaveBeenCalled()
    expect(result.current.ready).toBe(true)
  })
})
