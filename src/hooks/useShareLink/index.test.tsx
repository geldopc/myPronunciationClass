/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const createShare = vi.hoisted(() => vi.fn(async () => "slug123"))
const revokeShare = vi.hoisted(() => vi.fn(async () => undefined))
const readShareSlug = vi.hoisted(() =>
  vi.fn(async (): Promise<string | null> => null)
)
const authUser = vi.hoisted(() => ({
  uid: "u1",
  displayName: "Ada",
  avatarUrl: "",
}))
vi.mock("@/lib/shares", () => ({ createShare, revokeShare, readShareSlug }))
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({ user: authUser }),
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
  readShareSlug.mockClear()
  readShareSlug.mockImplementation(async () => null)
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

  it("rehydrates an existing share slug on mount without creating one", async () => {
    readShareSlug.mockImplementation(async () => "existing123")
    render(<Probe />)
    await screen.findByText(/s\/existing123$/)
    expect(createShare).not.toHaveBeenCalled()
  })
})
