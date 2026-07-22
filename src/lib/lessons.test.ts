import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  query: vi.fn((col) => col),
  orderBy: vi.fn(),
}))
vi.mock("@/lib/firebase", () => ({ db: {} }))

import { fetchLessons, fetchLesson, fetchPhrases } from "@/lib/lessons"
import { getDocs, getDoc } from "firebase/firestore"

beforeEach(() => vi.resetAllMocks())

const mockLesson = {
  id: "friends-s5e14",
  title: "Friends S5E14",
  youtubeId: "XZVHmRvfDHM",
  thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
  createdAt: 1700000000000,
  createdBy: "system",
}

describe("fetchLessons", () => {
  it("returns mapped lesson documents", async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: mockLesson.id, data: () => ({ ...mockLesson }) }],
    } as never)
    const result = await fetchLessons()
    expect(result).toEqual([mockLesson])
  })
})

describe("fetchLesson", () => {
  it("returns null when doc does not exist", async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never)
    expect(await fetchLesson("unknown")).toBeNull()
  })
  it("returns lesson when doc exists", async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      id: mockLesson.id,
      data: () => ({ ...mockLesson }),
    } as never)
    expect(await fetchLesson("friends-s5e14")).toEqual(mockLesson)
  })
})

describe("fetchPhrases", () => {
  it("returns phrases with string id and no audioSrc", async () => {
    const mockPhrase = { id: "phrase-1", order: 1, text: "Hello", speaker: "Ross",
      pronunciationHint: "tip", startTime: 0, endTime: 3 }
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: mockPhrase.id, data: () => ({ ...mockPhrase }) }],
    } as never)
    const result = await fetchPhrases("friends-s5e14")
    expect(result[0].id).toBe("phrase-1")
    expect((result[0] as Record<string, unknown>).audioSrc).toBeUndefined()
  })
})
