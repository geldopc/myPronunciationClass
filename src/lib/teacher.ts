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

export async function inviteTeacher(
	email: string,
	invitedByUid: string
): Promise<void> {
	if (USE_MOCK) return;
	await setDoc(doc(db, TEACHERS_COLLECTION, email), {
		status: "invited",
		invitedBy: invitedByUid,
		invitedAt: serverTimestamp(),
		activatedAt: null,
	});
}

export async function revokeTeacher(email: string): Promise<void> {
	if (USE_MOCK) return;
	await deleteDoc(doc(db, TEACHERS_COLLECTION, email));
}
