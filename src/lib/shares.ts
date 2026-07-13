import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { Share, ShareProfile, ShareSnapshot } from "@/lib/progress-model"

export function generateSlug(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("")
}

export async function createShare(
  uid: string,
  profile: ShareProfile,
  snapshot: ShareSnapshot
): Promise<string> {
  const slug = generateSlug()
  await setDoc(doc(db, "shares", slug), {
    uid,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    snapshot,
    createdAt: serverTimestamp(),
  })
  await setDoc(
    doc(db, "users", uid),
    { shareSlug: slug, shareEnabled: true },
    { merge: true }
  )
  return slug
}

export async function readShareSlug(uid: string): Promise<string | null> {
  const snapshot = await getDoc(doc(db, "users", uid))
  if (!snapshot.exists()) return null
  const data = snapshot.data() as {
    shareSlug?: string | null
    shareEnabled?: boolean
  }
  return data.shareEnabled && data.shareSlug ? data.shareSlug : null
}

export async function readShare(slug: string): Promise<Share | null> {
  const snapshot = await getDoc(doc(db, "shares", slug))
  if (!snapshot.exists()) return null
  const data = snapshot.data() as {
    displayName: string
    avatarUrl: string
    snapshot: ShareSnapshot
    createdAt?: { toMillis: () => number }
  }
  return {
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    snapshot: data.snapshot,
    createdAt: data.createdAt?.toMillis() ?? 0,
  }
}

export async function revokeShare(uid: string, slug: string): Promise<void> {
  await deleteDoc(doc(db, "shares", slug))
  await setDoc(
    doc(db, "users", uid),
    { shareSlug: null, shareEnabled: false },
    { merge: true }
  )
}
