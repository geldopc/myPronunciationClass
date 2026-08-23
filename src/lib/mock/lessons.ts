import type { Lesson, Phrase } from "@/lib/lessons";
import { MOCK_LESSON } from "@/lib/mock/data";
import { getMockPhrases } from "@/lib/mock/store";

export function mockFetchLessons(): Promise<Lesson[]> {
	return Promise.resolve([MOCK_LESSON]);
}

export function mockFetchLesson(_lessonId: string): Promise<Lesson | null> {
	return Promise.resolve(MOCK_LESSON);
}

export function mockFetchPhrases(_lessonId: string): Promise<Phrase[]> {
	return Promise.resolve(getMockPhrases());
}
