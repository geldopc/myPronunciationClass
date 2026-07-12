// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ProgressStats } from "@/components/ProgressStats"

afterEach(cleanup)

describe("ProgressStats", () => {
  it("renders completion, average and streak from rollups", () => {
    render(
      <ProgressStats
        displayName="Ada"
        avatarUrl=""
        rollups={{
          completion: 50,
          average: 80,
          streak: 3,
          bestScoreByPhrase: { 1: 90 },
        }}
      />
    )
    expect(screen.getByText(/80/)).toBeTruthy()
    expect(screen.getByText(/^3$/)).toBeTruthy()
    expect(screen.getByText("Ada")).toBeTruthy()
  })
})
