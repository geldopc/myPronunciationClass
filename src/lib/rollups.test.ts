import { describe, expect, it } from "vitest"

import { computeRollups, computeStreak } from "@/lib/rollups"
import type { PhraseStat } from "@/lib/progress-model"

const stat = (phraseId: number, bestScore: number): PhraseStat => ({
  phraseId,
  bestScore,
  attemptsCount: 1,
  lastPracticedAt: 0,
})

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(
      computeStreak(["2026-07-12", "2026-07-11", "2026-07-10"], "2026-07-12")
    ).toBe(3)
  })
  it("is zero when today has no practice", () => {
    expect(computeStreak(["2026-07-10"], "2026-07-12")).toBe(0)
  })
  it("stops at the first gap", () => {
    expect(computeStreak(["2026-07-12", "2026-07-10"], "2026-07-12")).toBe(1)
  })
})

describe("computeRollups", () => {
  it("derives completion, average and best-score map", () => {
    const r = computeRollups(
      [stat(1, 90), stat(2, 70)],
      4,
      ["2026-07-12"],
      "2026-07-12"
    )
    expect(r.completion).toBe(50)
    expect(r.average).toBe(80)
    expect(r.bestScoreByPhrase).toEqual({ 1: 90, 2: 70 })
    expect(r.streak).toBe(1)
  })
  it("is all-zero with no stats", () => {
    const r = computeRollups([], 4, [], "2026-07-12")
    expect(r).toEqual({
      completion: 0,
      average: 0,
      streak: 0,
      bestScoreByPhrase: {},
    })
  })
})
