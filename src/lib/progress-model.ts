import type { Difficulty } from "@/lib/difficulty";

export type Attempt = {
	lessonId: string;
	phraseId: string;
	difficulty: Difficulty;
	score: number;
	transcript: string;
};

export type PhraseStat = {
	lessonId: string;
	phraseId: string;
	bestScore: number;
	attemptsCount: number;
	lastPracticedAt: number;
};

export type LessonRollup = {
	lessonId: string;
	completion: number;
	average: number;
	lastPracticedAt: number | null;
};

export type Rollups = {
	completion: number;
	average: number;
	streak: number;
	bestScoreByPhrase: Record<string, number | undefined>;
	byLesson: LessonRollup[];
};

export type ShareProfile = {
	displayName: string;
	avatarUrl: string;
};

export type ShareSnapshot = Rollups;

export type Share = ShareProfile & {
	snapshot: ShareSnapshot;
	createdAt: number;
};
