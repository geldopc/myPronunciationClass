// @vitest-environment jsdom
/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
import { cleanup, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

let authCallback: ((user: unknown) => void) | null = null

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: vi.fn((_auth, cb: (user: unknown) => void) => {
    authCallback = cb
    return () => {}
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))
vi.mock("@/lib/firebase", () => ({ auth: {}, googleProvider: {} }))

import { AuthProvider, useAuth } from "@/providers/Auth"

function Probe() {
  const { user, loading } = useAuth()
  if (loading) return <span>loading</span>
  return <span>{user ? user.displayName : "anon"}</span>
}

afterEach(() => {
  cleanup()
  authCallback = null
})

describe("AuthProvider", () => {
  it("starts loading, then resolves to anon and to a signed-in user", async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    expect(screen.getByText("loading")).toBeTruthy()

    authCallback?.(null)
    await waitFor(() => {
      expect(screen.getByText("anon")).toBeTruthy()
    })

    authCallback?.({
      uid: "u1",
      displayName: "Ada",
      photoURL: "http://x/a.png",
    })
    await waitFor(() => {
      expect(screen.getByText("Ada")).toBeTruthy()
    })
  })
})
