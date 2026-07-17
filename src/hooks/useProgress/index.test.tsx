// @vitest-environment jsdom
/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const recordAttempt = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock("@/lib/attempts", () => ({
  recordAttempt,
  readPhraseStats: vi.fn(async () => [
    { phraseId: 1, bestScore: 90, attemptsCount: 1, lastPracticedAt: 0 },
  ]),
  readPracticeDays: vi.fn(async () => []),
}))
let mockUser: { uid: string; displayName: string; avatarUrl: string } | null = {
  uid: "u1",
  displayName: "Ada",
  avatarUrl: "",
}
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({ user: mockUser, loading: false }),
}))

import { useProgress } from "@/hooks/useProgress"
import type { PhraseStat } from "@/lib/progress-model"

let capturedPhraseStats: PhraseStat[] = []

function Probe() {
  const { rollups, phraseStats, recordEvaluation } = useProgress()
  capturedPhraseStats = phraseStats
  return (
    <button
      type="button"
      onClick={() =>
        recordEvaluation(2, "easy", { transcript: "hi", score: 70 })
      }
    >
      {rollups.completion}
    </button>
  )
}

afterEach(() => {
  cleanup()
  recordAttempt.mockClear()
  mockUser = { uid: "u1", displayName: "Ada", avatarUrl: "" }
  capturedPhraseStats = []
})

describe("useProgress", () => {
  it("persists an evaluation for a logged-in user", async () => {
    render(<Probe />)
    await screen.findByRole("button")
    screen.getByRole("button").click()
    expect(recordAttempt).toHaveBeenCalledWith("u1", {
      phraseId: 2,
      difficulty: "easy",
      score: 70,
      transcript: "hi",
    })
    expect(capturedPhraseStats).toHaveLength(1)
    expect(capturedPhraseStats[0].phraseId).toBe(1)
  })

  it("does not persist when logged out", async () => {
    mockUser = null
    render(<Probe />)
    screen.getByRole("button").click()
    expect(recordAttempt).not.toHaveBeenCalled()
  })
})
