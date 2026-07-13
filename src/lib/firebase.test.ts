import { describe, expect, it, vi } from "vitest"

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "app" })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: "app" })),
}))
vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({ __brand: "auth" })),
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
}))
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({ __brand: "db" })),
}))

describe("firebase init", () => {
  it("exports auth, db and a google provider", async () => {
    const mod = await import("@/lib/firebase")
    expect(mod.auth).toEqual({ __brand: "auth" })
    expect(mod.db).toEqual({ __brand: "db" })
    expect(mod.googleProvider).toBeInstanceOf(
      (await import("firebase/auth")).GoogleAuthProvider
    )
  })
})
