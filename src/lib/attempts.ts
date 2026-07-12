import {
  addDoc,
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { Attempt, PhraseStat } from "@/lib/progress-model"

export async function recordAttempt(
  uid: string,
  attempt: Attempt
): Promise<void> {
  await addDoc(collection(db, "users", uid, "attempts"), {
    ...attempt,
    createdAt: serverTimestamp(),
  })

  const statRef = doc(db, "users", uid, "phraseStats", String(attempt.phraseId))
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(statRef)
    const previous = snapshot.exists()
      ? (snapshot.data() as { bestScore: number; attemptsCount: number })
      : { bestScore: 0, attemptsCount: 0 }
    transaction.set(statRef, {
      phraseId: attempt.phraseId,
      bestScore: Math.max(previous.bestScore, attempt.score),
      attemptsCount: previous.attemptsCount + 1,
      lastPracticedAt: serverTimestamp(),
    })
  })
}

export async function readPhraseStats(uid: string): Promise<PhraseStat[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "phraseStats"))
  return snapshot.docs.map((entry) => {
    const data = entry.data() as {
      phraseId: number
      bestScore: number
      attemptsCount: number
      lastPracticedAt?: { toMillis: () => number }
    }
    return {
      phraseId: data.phraseId,
      bestScore: data.bestScore,
      attemptsCount: data.attemptsCount,
      lastPracticedAt: data.lastPracticedAt?.toMillis() ?? 0,
    }
  })
}

export async function readPracticeDays(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "attempts"))
  const days = new Set<string>()
  for (const entry of snapshot.docs) {
    const createdAt = (entry.data() as { createdAt?: { toDate: () => Date } })
      .createdAt
    if (createdAt) days.add(createdAt.toDate().toISOString().slice(0, 10))
  }
  return [...days]
}
