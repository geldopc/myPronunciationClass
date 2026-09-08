import type { Lesson, Phrase } from "@/lib/lessons";
import { MOCK_LESSON, MOCK_PHRASES } from "@/lib/mock/data";

// Mutable in-memory store — persists within the session in mock mode.
// Use exportPhrases() + the ClipEditor "Export JSON" button to save work to disk.
const phrasesByLesson: Record<string, Phrase[]> = {
	[MOCK_LESSON.id]: JSON.parse(JSON.stringify(MOCK_PHRASES)) as Phrase[],
};
let lessons: Lesson[] = JSON.parse(JSON.stringify([MOCK_LESSON])) as Lesson[];

export function getMockPhrases(lessonId: string): Phrase[] {
	return [...(phrasesByLesson[lessonId] ?? [])].sort(
		(a, b) => a.order - b.order
	);
}

export function mockUpsertPhrase(
	lessonId: string,
	phraseId: string | null,
	data: Omit<Phrase, "id">
): string {
	const existing = phrasesByLesson[lessonId] ?? [];
	if (phraseId) {
		phrasesByLesson[lessonId] = existing.map((p) =>
			p.id === phraseId ? { id: phraseId, ...data } : p
		);
		return phraseId;
	}
	const id = `phrase-${Date.now()}`;
	phrasesByLesson[lessonId] = [...existing, { id, ...data }];
	return id;
}

export function mockDeletePhrase(lessonId: string, phraseId: string): void {
	phrasesByLesson[lessonId] = (phrasesByLesson[lessonId] ?? []).filter(
		(p) => p.id !== phraseId
	);
}

export function exportPhrases(lessonId: string): Phrase[] {
	return [...(phrasesByLesson[lessonId] ?? [])].sort(
		(a, b) => a.order - b.order
	);
}

export function getMockLessons(): Lesson[] {
	return [...lessons].sort((a, b) => b.createdAt - a.createdAt);
}

export function getMockLesson(lessonId: string): Lesson | null {
	return lessons.find((l) => l.id === lessonId) ?? null;
}

export function mockCreateLesson(
	data: Omit<Lesson, "id" | "phraseCount" | "createdAt" | "status">
): string {
	const id = `lesson-${Date.now()}`;
	lessons = [
		...lessons,
		{ id, ...data, phraseCount: 0, createdAt: Date.now(), status: "draft" },
	];
	phrasesByLesson[id] = [];
	return id;
}

export function mockSetLessonStatus(
	lessonId: string,
	status: Lesson["status"]
): void {
	lessons = lessons.map((l) => (l.id === lessonId ? { ...l, status } : l));
}
