import { describe, expect, it } from "vitest"

import { getRevealState } from "@/lib/difficulty"

describe("getRevealState", () => {
  it("easy pre-attempt shows text and hint", () => {
    expect(getRevealState("easy", false)).toEqual({
      showText: true,
      showHint: true,
      canPeekHint: false,
    })
  })

  it("moderate pre-attempt shows text, hides hint, allows peek", () => {
    expect(getRevealState("moderate", false)).toEqual({
      showText: true,
      showHint: false,
      canPeekHint: true,
    })
  })

  it("hard pre-attempt hides text and hint with no peek", () => {
    expect(getRevealState("hard", false)).toEqual({
      showText: false,
      showHint: false,
      canPeekHint: false,
    })
  })

  it("any mode post-attempt reveals text and hint", () => {
    for (const difficulty of ["easy", "moderate", "hard"] as const) {
      expect(getRevealState(difficulty, true)).toEqual({
        showText: true,
        showHint: true,
        canPeekHint: false,
      })
    }
  })
})
