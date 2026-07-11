import { describe, expect, it } from "vitest"

import { phrases } from "@/lib/phrases"

describe("phrases data", () => {
  it("has 36 phrases", () => {
    expect(phrases).toHaveLength(36)
  })

  it("every phrase has a non-empty speaker", () => {
    for (const phrase of phrases) {
      expect(phrase.speaker.trim().length).toBeGreaterThan(0)
    }
  })
})
