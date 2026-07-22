import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

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
  const snap = await getDocs(collection(db, "lessons"))
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lesson, "id">),
  }))
}

export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
  const snap = await getDoc(doc(db, "lessons", lessonId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<Lesson, "id">) }
}

export async function fetchPhrases(lessonId: string): Promise<Phrase[]> {
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
