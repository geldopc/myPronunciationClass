// @vitest-environment jsdom
/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const recordEvaluation = vi.fn(async () => undefined)
vi.mock("@/hooks/useLesson", () => ({
  useLesson: () => ({
    lesson: { id: "friends-s5e14", title: "Friends S5E14", youtubeId: "XZVHmRvfDHM", thumbnailUrl: "", createdAt: 0, createdBy: "" },
    phrases: [
      { id: "1", order: 1, text: "Hey, how was your conference?", speaker: "Chandler", pronunciationHint: "tip", startTime: 0, endTime: 8 },
    ],
    loading: false,
  }),
}))
vi.mock("@/components/Galaxy", () => ({
  Galaxy: () => null,
}))
vi.mock("@/components/ShapeGrid", () => ({
  ShapeGrid: () => null,
}))
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock("@/hooks/useProgress", () => ({
  useProgress: () => ({
    rollups: { completion: 0, average: 0, streak: 0, bestScoreByPhrase: {} },
    loading: false,
    recordEvaluation,
  }),
}))
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({
    user: { uid: "u1", displayName: "Ada", avatarUrl: "" },
    loading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
  }),
}))

import { ListeningSpeakingApp } from "@/components/ListeningSpeakingApp"
import { ThemeProvider } from "@/providers/Theme"

afterEach(() => {
  cleanup()
  recordEvaluation.mockClear()
})

describe("ListeningSpeakingApp persistence", () => {
  it("renders and exposes a persistence hook without breaking the anonymous UI", () => {
    const { container } = render(
      <ThemeProvider>
        <ListeningSpeakingApp />
      </ThemeProvider>
    )
    expect(container.querySelector("#listening-speaking-app")).toBeTruthy()
    expect(recordEvaluation).not.toHaveBeenCalled()
  })
})
