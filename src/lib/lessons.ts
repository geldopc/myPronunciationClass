import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	increment,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
	mockFetchLesson,
	mockFetchLessons,
	mockFetchPhrases,
} from "@/lib/mock/lessons";
import {
	mockCreateLesson,
	mockDeletePhrase,
	mockSetLessonStatus,
	mockUpsertPhrase,
} from "@/lib/mock/store";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export type Lesson = {
	id: string;
	title: string;
	youtubeId: string;
	thumbnailUrl: string;
	createdAt: number;
	createdBy: string;
	phraseCount: number;
	status: "draft" | "published";
};

export type Phrase = {
	id: string;
	order: number;
	text: string;
	speaker: string;
	pronunciationHint: string;
	startTime: number;
	endTime: number;
};

export function isPhraseReady(phrase: Phrase): boolean {
	return !phrase.text.startsWith("SUBSTITUA_PELA_FRASE_");
}

export async function fetchLessons(): Promise<Lesson[]> {
	if (USE_MOCK) return mockFetchLessons();
	const snap = await getDocs(collection(db, "lessons"));
	return snap.docs.map((d) => ({
		id: d.id,
		...(d.data() as Omit<Lesson, "id">),
	}));
}

/* Hides drafts rather than requiring "published": lessons created before the
   status field existed carry no status at all, and they were visible to
   everyone by definition — matching on "published" would hide every one. */
export async function fetchPublishedLessons(): Promise<Lesson[]> {
	const lessons = await fetchLessons();
	return lessons.filter((l) => l.status !== "draft");
}

export async function fetchLesson(lessonId: string): Promise<Lesson | null> {
	if (USE_MOCK) return mockFetchLesson(lessonId);
	const snap = await getDoc(doc(db, "lessons", lessonId));
	if (!snap.exists()) return null;
	return { id: snap.id, ...(snap.data() as Omit<Lesson, "id">) };
}

export async function fetchPhrases(lessonId: string): Promise<Phrase[]> {
	if (USE_MOCK) return mockFetchPhrases(lessonId);
	const q = query(
		collection(db, "lessons", lessonId, "phrases"),
		orderBy("order")
	);
	const snap = await getDocs(q);
	return snap.docs.map((d) => ({
		id: d.id,
		...(d.data() as Omit<Phrase, "id">),
	}));
}

export async function createLesson(data: {
	title: string;
	youtubeId: string;
	thumbnailUrl: string;
	createdBy: string;
}): Promise<string> {
	if (USE_MOCK) return mockCreateLesson(data);
	const ref = await addDoc(collection(db, "lessons"), {
		...data,
		phraseCount: 0,
		status: "draft",
		createdAt: serverTimestamp(),
	});
	return ref.id;
}

export async function setLessonStatus(
	lessonId: string,
	status: Lesson["status"]
): Promise<void> {
	if (USE_MOCK) {
		mockSetLessonStatus(lessonId, status);
		return;
	}
	await updateDoc(doc(db, "lessons", lessonId), { status });
}

export async function upsertPhrase(
	lessonId: string,
	phraseId: string | null,
	data: Omit<Phrase, "id">
): Promise<string> {
	if (USE_MOCK) return mockUpsertPhrase(lessonId, phraseId, data);
	if (phraseId) {
		await setDoc(doc(db, "lessons", lessonId, "phrases", phraseId), data);
		return phraseId;
	}
	const ref = await addDoc(
		collection(db, "lessons", lessonId, "phrases"),
		data
	);
	await updateDoc(doc(db, "lessons", lessonId), { phraseCount: increment(1) });
	return ref.id;
}

export async function deletePhrase(
	lessonId: string,
	phraseId: string
): Promise<void> {
	if (USE_MOCK) {
		mockDeletePhrase(lessonId, phraseId);
		return;
	}
	await deleteDoc(doc(db, "lessons", lessonId, "phrases", phraseId));
	await updateDoc(doc(db, "lessons", lessonId), { phraseCount: increment(-1) });
}
