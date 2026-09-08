import type { Lesson, Phrase } from "@/lib/lessons";
import {
	getMockLesson,
	getMockLessons,
	getMockPhrases,
} from "@/lib/mock/store";

export function mockFetchLessons(): Promise<Lesson[]> {
	return Promise.resolve(getMockLessons());
}

export function mockFetchLesson(lessonId: string): Promise<Lesson | null> {
	return Promise.resolve(getMockLesson(lessonId));
}

export function mockFetchPhrases(lessonId: string): Promise<Phrase[]> {
	return Promise.resolve(getMockPhrases(lessonId));
}
