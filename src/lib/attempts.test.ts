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
  addDoc: vi.fn(async () => ({ id: "a1" })),
  runTransaction: vi.fn(async (_db, fn) => {
    await fn({
      get: async () => ({ exists: () => false, data: () => undefined }),
      set: vi.fn(),
      update: vi.fn(),
    })
  }),
  collection: vi.fn((...args) => ["collection", ...args]),
  doc: vi.fn((...args) => ["doc", ...args]),
  getDocs: vi.fn(async () => ({ docs: [] })),
  getFirestore: vi.fn(() => ({ __brand: "db" })),
  serverTimestamp: vi.fn(() => "ts"),
}))

import { recordAttempt } from "@/lib/attempts"
import { addDoc, runTransaction } from "firebase/firestore"

describe("recordAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("appends an attempt and upserts the phrase stat in a transaction", async () => {
    await recordAttempt("u1", {
      phraseId: 3,
      difficulty: "easy",
      score: 88,
      transcript: "hello",
    })
    expect(addDoc).toHaveBeenCalledTimes(1)
    expect(runTransaction).toHaveBeenCalledTimes(1)
  })
})
