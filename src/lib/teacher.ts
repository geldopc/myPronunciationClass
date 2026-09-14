import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

/* Teacher records still live under the legacy "admins" collection. Changing
   this id requires migrating the existing documents first — otherwise every
   teacher silently loses access. */
const TEACHERS_COLLECTION = "admins";

export type TeacherRecord = {
	email: string;
	status: "invited" | "active";
	invitedBy: string;
	invitedAt: number;
	activatedAt: number | null;
};

const MOCK_TEACHERS: TeacherRecord[] = [
	{
		email: "geldopc@gmail.com",
		status: "active",
		invitedBy: "system",
		invitedAt: 1721000000000,
		activatedAt: 1721000000000,
	},
];

export async function fetchTeachers(): Promise<TeacherRecord[]> {
	if (USE_MOCK) return MOCK_TEACHERS;
	const snap = await getDocs(collection(db, TEACHERS_COLLECTION));
	return snap.docs.map((d) => ({
		email: d.id,
		...(d.data() as Omit<TeacherRecord, "email">),
	}));
}

export async function getTeacherStatus(
	email: string
): Promise<"invited" | "active" | null> {
	if (USE_MOCK) return "active";
	const snap = await getDoc(doc(db, TEACHERS_COLLECTION, email));
	if (!snap.exists()) return null;
	return (snap.data() as { status: "invited" | "active" }).status;
}

export async function activateTeacher(email: string): Promise<void> {
	if (USE_MOCK) return;
	await updateDoc(doc(db, TEACHERS_COLLECTION, email), {
		status: "active",
		activatedAt: serverTimestamp(),
	});
}

export type InviteResult = "created" | "already-invited" | "already-active";

/* Checks before writing, because re-inviting an existing address is not a
   create but an update, and the update rule deliberately lets only the
   invitee touch their own record — so a blind setDoc fails with a bare
   permission error that says nothing about what actually happened. */
export async function inviteTeacher(
	email: string,
	invitedByUid: string
): Promise<InviteResult> {
	if (USE_MOCK) return "created";
	const ref = doc(db, TEACHERS_COLLECTION, email);
	const existing = await getDoc(ref);
	if (existing.exists()) {
		const { status } = existing.data() as { status: "invited" | "active" };
		return status === "active" ? "already-active" : "already-invited";
	}
	await setDoc(ref, {
		status: "invited",
		invitedBy: invitedByUid,
		invitedAt: serverTimestamp(),
		activatedAt: null,
	});
	return "created";
}

export async function revokeTeacher(email: string): Promise<void> {
	if (USE_MOCK) return;
	await deleteDoc(doc(db, TEACHERS_COLLECTION, email));
}
