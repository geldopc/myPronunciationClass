import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"

import { db } from "@/lib/firebase"

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true"

export type AdminRecord = {
  email: string
  status: "invited" | "active"
  invitedBy: string
  invitedAt: number
  activatedAt: number | null
}

const MOCK_ADMINS: AdminRecord[] = [
  {
    email: "geldopc@gmail.com",
    status: "active",
    invitedBy: "system",
    invitedAt: 1721000000000,
    activatedAt: 1721000000000,
  },
]

export async function fetchAdmins(): Promise<AdminRecord[]> {
  if (USE_MOCK) return MOCK_ADMINS
  const snap = await getDocs(collection(db, "admins"))
  return snap.docs.map((d) => ({
    email: d.id,
    ...(d.data() as Omit<AdminRecord, "email">),
  }))
}

export async function getAdminStatus(
  email: string
): Promise<"invited" | "active" | null> {
  if (USE_MOCK) return "active"
  const snap = await getDoc(doc(db, "admins", email))
  if (!snap.exists()) return null
  return (snap.data() as { status: "invited" | "active" }).status
}

export async function activateAdmin(email: string): Promise<void> {
  if (USE_MOCK) return
  await updateDoc(doc(db, "admins", email), {
    status: "active",
    activatedAt: serverTimestamp(),
  })
}

export async function inviteAdmin(
  email: string,
  invitedByUid: string
): Promise<void> {
  if (USE_MOCK) return
  await setDoc(doc(db, "admins", email), {
    status: "invited",
    invitedBy: invitedByUid,
    invitedAt: serverTimestamp(),
    activatedAt: null,
  })
}

export async function revokeAdmin(email: string): Promise<void> {
  if (USE_MOCK) return
  await deleteDoc(doc(db, "admins", email))
}
