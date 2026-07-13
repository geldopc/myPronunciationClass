/* eslint-disable import/first -- vi.mock factories below reference the
   outer `const`s that vitest hoists; importing after them keeps that
   hoisting intact. */
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
  deleteDoc: vi.fn(async () => undefined),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
  doc: vi.fn((...args) => ["doc", ...args]),
  getFirestore: vi.fn(() => ({ __brand: "db" })),
  serverTimestamp: vi.fn(() => "ts"),
}))

import {
  createShare,
  generateSlug,
  readShare,
  readShareSlug,
  revokeShare,
} from "@/lib/shares"
import { deleteDoc, getDoc, setDoc } from "firebase/firestore"

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
    const profile = { displayName: "Ada", avatarUrl: "http://x/a.png" }
    const snapshot = {
      completion: 50,
      average: 80,
      streak: 1,
      bestScoreByPhrase: { 1: 90 },
    }

    const slug = await createShare("u1", profile, snapshot)

    expect(typeof slug).toBe("string")
    expect(setDoc).toHaveBeenCalledTimes(2)

    const shareCall = vi.mocked(setDoc).mock.calls[0]
    const written = shareCall[1] as Record<string, unknown>
    expect(written.uid).toBe("u1")
    expect(written.displayName).toBe(profile.displayName)
    expect(written.avatarUrl).toBe(profile.avatarUrl)
    expect(written.snapshot).toEqual(snapshot)
    expect(written).not.toHaveProperty("transcript")

    const userCall = vi.mocked(setDoc).mock.calls[1]
    expect(userCall[0]).toEqual(["doc", expect.anything(), "users", "u1"])
    expect(userCall[1]).toEqual({ shareSlug: slug, shareEnabled: true })
    expect(userCall[2]).toEqual({ merge: true })
  })

  it("returns null for a missing share", async () => {
    expect(await readShare("nope")).toBeNull()
  })

  it("reads the active share slug for a user", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ shareSlug: "s1", shareEnabled: true }),
    } as never)
    expect(await readShareSlug("u1")).toBe("s1")
  })

  it("returns null when sharing is disabled", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ shareSlug: "s1", shareEnabled: false }),
    } as never)
    expect(await readShareSlug("u1")).toBeNull()
  })

  it("returns null when the user doc does not exist", async () => {
    vi.mocked(getDoc).mockResolvedValueOnce({
      exists: () => false,
      data: () => undefined,
    } as never)
    expect(await readShareSlug("u1")).toBeNull()
  })

  it("revokes a share by deleting it and clearing the user's slug", async () => {
    await revokeShare("u1", "s1")

    expect(deleteDoc).toHaveBeenCalledWith([
      "doc",
      expect.anything(),
      "shares",
      "s1",
    ])
    expect(setDoc).toHaveBeenCalledWith(
      ["doc", expect.anything(), "users", "u1"],
      { shareSlug: null, shareEnabled: false },
      { merge: true }
    )
  })
})
