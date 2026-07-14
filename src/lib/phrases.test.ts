import { describe, expect, it } from "vitest"

import { SOURCE_VIDEO_ID, phrases } from "@/lib/phrases"

describe("phrases data", () => {
  it("has 36 phrases", () => {
    expect(phrases).toHaveLength(36)
  })

  it("every phrase has a non-empty speaker", () => {
    for (const phrase of phrases) {
      expect(phrase.speaker.trim().length).toBeGreaterThan(0)
    }
  })

  it("every phrase has startTime < endTime", () => {
    for (const phrase of phrases) {
      expect(phrase.startTime).toBeLessThan(phrase.endTime)
    }
  })

  it("SOURCE_VIDEO_ID is set", () => {
    expect(SOURCE_VIDEO_ID).toBe("XZVHmRvfDHM")
  })

  it("last phrase ends at or before 190.337s", () => {
    const last = phrases[phrases.length - 1]
    expect(last.endTime).toBeLessThanOrEqual(190.337)
  })
})
