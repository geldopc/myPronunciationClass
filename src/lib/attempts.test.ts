/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
import { describe, expect, it, vi, beforeEach } from "vitest"

const setMock = vi.fn()

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
      get: async () => ({
        exists: () => true,
        data: () => ({ bestScore: 50, attemptsCount: 2 }),
      }),
      set: setMock,
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

  it("keeps the higher score and increments the attempt count against an existing stat", async () => {
    await recordAttempt("u1", {
      phraseId: 3,
      difficulty: "easy",
      score: 40,
      transcript: "hello",
    })

    expect(setMock).toHaveBeenCalledTimes(1)
    const written = setMock.mock.calls[0][1] as {
      phraseId: number
      bestScore: number
      attemptsCount: number
    }
    expect(written.phraseId).toBe(3)
    expect(written.bestScore).toBe(50)
    expect(written.attemptsCount).toBe(3)
  })

  it("raises the best score when the new attempt scores higher than the existing best", async () => {
    await recordAttempt("u1", {
      phraseId: 3,
      difficulty: "easy",
      score: 95,
      transcript: "hello",
    })

    const written = setMock.mock.calls[0][1] as {
      bestScore: number
      attemptsCount: number
    }
    expect(written.bestScore).toBe(95)
    expect(written.attemptsCount).toBe(3)
  })
})
