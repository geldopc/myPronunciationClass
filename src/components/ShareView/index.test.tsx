/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const readShare = vi.hoisted(() => vi.fn())
vi.mock("@/lib/shares", () => ({ readShare }))

import { ShareView } from "@/components/ShareView"

afterEach(() => {
  cleanup()
  readShare.mockReset()
})

describe("ShareView", () => {
  it("renders the snapshot for a valid slug", async () => {
    readShare.mockResolvedValue({
      displayName: "Ada",
      avatarUrl: "",
      createdAt: 0,
      snapshot: {
        completion: 50,
        average: 80,
        streak: 2,
        bestScoreByPhrase: { 1: 90 },
      },
    })
    render(<ShareView slug="slug123" />)
    await waitFor(() => expect(screen.getByText("Ada")).toBeTruthy())
    expect(screen.getByText(/80/)).toBeTruthy()
  })

  it("shows a not-found state for a missing slug", async () => {
    readShare.mockResolvedValue(null)
    render(<ShareView slug="nope" />)
    await waitFor(() =>
      expect(screen.getByText(/não encontrado/i)).toBeTruthy()
    )
  })
})
