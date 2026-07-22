import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  mockFetchLessons,
  mockFetchLesson,
  mockFetchPhrases,
} from "@/lib/mock/lessons"

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"

export type Lesson = {
  id: string
  title: string
  youtubeId: string
  thumbnailUrl: string
  createdAt: number
  createdBy: string
}

export type Phrase = {
  id: string
  order: number
  text: string
  speaker: string
  pronunciationHint: string
  startTime: number
  endTime: number
}

export function isPhraseReady(phrase: Phrase): boolean {
  return !phrase.text.startsWith("SUBSTITUA_PELA_FRASE_")
}

export async function fetchLessons(): Promise<Lesson[]> {
  if (USE_MOCK) return mockFetchLessons()
  const snap = await getDocs(collection(db, "lessons"))
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lesson, "id">),
  }))
}

export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
  if (USE_MOCK) return mockFetchLesson(lessonId)
  const snap = await getDoc(doc(db, "lessons", lessonId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Lesson, "id">) }
}

export async function fetchPhrases(lessonId: string): Promise<Phrase[]> {
  if (USE_MOCK) return mockFetchPhrases(lessonId)
  const q = query(
    collection(db, "lessons", lessonId, "phrases"),
    orderBy("order")
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Phrase, "id">),
  }))
}
