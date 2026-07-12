import { describe, expect, it, vi, beforeEach } from "vitest"

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
  setDoc: vi.fn(async () => undefined),
  updateDoc: vi.fn(async () => undefined),
  deleteDoc: vi.fn(async () => undefined),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
  doc: vi.fn((...args) => ["doc", ...args]),
  getFirestore: vi.fn(() => ({ __brand: "db" })),
  serverTimestamp: vi.fn(() => "ts"),
}))

import { createShare, generateSlug, readShare } from "@/lib/shares"
import { setDoc, updateDoc } from "firebase/firestore"

describe("shares", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("generates an unguessable slug", () => {
    const a = generateSlug()
    const b = generateSlug()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(12)
  })

  it("creates a public share doc and links it on the user", async () => {
    const slug = await createShare(
      "u1",
      { displayName: "Ada", avatarUrl: "http://x/a.png" },
      { completion: 50, average: 80, streak: 1, bestScoreByPhrase: { 1: 90 } }
    )
    expect(typeof slug).toBe("string")
    expect(setDoc).toHaveBeenCalledTimes(1)
    expect(updateDoc).toHaveBeenCalledTimes(1)
  })

  it("returns null for a missing share", async () => {
    expect(await readShare("nope")).toBeNull()
  })
})
