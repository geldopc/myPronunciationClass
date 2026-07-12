/* eslint-disable import/first */
// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const signInWithGoogle = vi.fn()
let mockUser: { uid: string; displayName: string; avatarUrl: string } | null =
  null
vi.mock("@/providers/Auth", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signInWithGoogle,
    signOut: vi.fn(),
  }),
}))
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

import { AuthControl } from "@/components/TopBar/AuthControl"

afterEach(() => {
  cleanup()
  signInWithGoogle.mockClear()
  mockUser = null
})

describe("AuthControl", () => {
  it("shows a sign-in button when logged out and calls signIn", () => {
    render(<AuthControl />)
    const button = screen.getByRole("button", { name: /entrar/i })
    fireEvent.click(button)
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
  })

  it("shows the user avatar trigger when logged in", () => {
    mockUser = { uid: "u1", displayName: "Ada", avatarUrl: "" }
    render(<AuthControl />)
    expect(screen.getByRole("button", { name: /ada/i })).toBeTruthy()
  })
})
