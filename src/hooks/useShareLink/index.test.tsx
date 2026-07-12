/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const createShare = vi.hoisted(() => vi.fn(async () => "slug123"))
const revokeShare = vi.hoisted(() => vi.fn(async () => undefined))
vi.mock("@/lib/shares", () => ({ createShare, revokeShare }))
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({ user: { uid: "u1", displayName: "Ada", avatarUrl: "" } }),
}))

import { useShareLink } from "@/hooks/useShareLink"

const rollups = {
  completion: 50,
  average: 80,
  streak: 1,
  bestScoreByPhrase: { 1: 90 },
}

function Probe() {
  const { shareUrl, create } = useShareLink(rollups)
  return (
    <button type="button" onClick={() => void create()}>
      {shareUrl ?? "no-link"}
    </button>
  )
}

afterEach(() => {
  cleanup()
  createShare.mockClear()
  revokeShare.mockClear()
})

describe("useShareLink", () => {
  it("creates a share and exposes a base-aware url", async () => {
    render(<Probe />)
    screen.getByRole("button").click()
    await screen.findByText(/s\/slug123$/)
    expect(createShare).toHaveBeenCalledWith(
      "u1",
      { displayName: "Ada", avatarUrl: "" },
      rollups
    )
  })
})
