import {
	addDoc,
	collection,
	doc,
	getDocs,
	runTransaction,
	serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Attempt, PhraseStat } from "@/lib/progress-model";
import {
	mockRecordAttempt,
	mockReadPhraseStats,
	mockReadPracticeDays,
} from "@/lib/mock/attempts";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

export async function recordAttempt(
	uid: string,
	attempt: Attempt,
): Promise<void> {
	if (USE_MOCK) return mockRecordAttempt(uid, attempt);
	await addDoc(collection(db, "users", uid, "attempts"), {
		...attempt,
		createdAt: serverTimestamp(),
	});

	const statKey = `${attempt.lessonId}_${attempt.phraseId}`;
	const statRef = doc(db, "users", uid, "phraseStats", statKey);
	await runTransaction(db, async (transaction) => {
		const snapshot = await transaction.get(statRef);
		const previous = snapshot.exists()
			? (snapshot.data() as { bestScore: number; attemptsCount: number })
			: { bestScore: 0, attemptsCount: 0 };
		transaction.set(statRef, {
			lessonId: attempt.lessonId,
			phraseId: attempt.phraseId,
			bestScore: Math.max(previous.bestScore, attempt.score),
			attemptsCount: previous.attemptsCount + 1,
			lastPracticedAt: serverTimestamp(),
		});
	});
}

export async function readPhraseStats(
	uid: string,
	lessonId?: string,
): Promise<PhraseStat[]> {
	if (USE_MOCK) return mockReadPhraseStats(uid, lessonId);
	const snapshot = await getDocs(collection(db, "users", uid, "phraseStats"));
	return snapshot.docs
		.filter((entry) => {
			if (!lessonId) return true;
			return entry.id.startsWith(`${lessonId}_`);
		})
		.map((entry) => {
			const data = entry.data() as {
				lessonId: string;
				phraseId: string;
				bestScore: number;
				attemptsCount: number;
				lastPracticedAt?: { toMillis: () => number };
			};
			return {
				lessonId: data.lessonId,
				phraseId: data.phraseId,
				bestScore: data.bestScore,
				attemptsCount: data.attemptsCount,
				lastPracticedAt: data.lastPracticedAt?.toMillis() ?? 0,
			};
		});
}

export async function readPracticeDays(uid: string): Promise<string[]> {
	if (USE_MOCK) return mockReadPracticeDays(uid);
	const snapshot = await getDocs(collection(db, "users", uid, "attempts"));
	const days = new Set<string>();
	for (const entry of snapshot.docs) {
		const createdAt = (entry.data() as { createdAt?: { toDate: () => Date } })
			.createdAt;
		if (createdAt) days.add(createdAt.toDate().toISOString().slice(0, 10));
	}
	return [...days];
}
