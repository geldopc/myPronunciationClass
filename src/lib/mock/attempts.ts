import { faker } from "@faker-js/faker";
import { MOCK_PHRASES } from "@/lib/mock/data";
import type { Attempt, PhraseStat } from "@/lib/progress-model";

const STORAGE_KEY = "mock_phraseStats";

function loadStats(): PhraseStat[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? (JSON.parse(raw) as PhraseStat[]) : generateInitialStats();
	} catch {
		return generateInitialStats();
	}
}

function saveStats(stats: PhraseStat[]) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function generateInitialStats(): PhraseStat[] {
	const practicedCount = Math.floor(MOCK_PHRASES.length / 2);
	const stats = MOCK_PHRASES.slice(0, practicedCount).map((phrase) => ({
		phraseId: phrase.id,
		lessonId: "friends-s5e14",
		attemptsCount: faker.number.int({ min: 1, max: 8 }),
		bestScore: faker.number.int({ min: 40, max: 99 }),
		lastPracticedAt: faker.date.recent({ days: 7 }).getTime(),
	}));
	saveStats(stats);
	return stats;
}

export function mockRecordAttempt(
	_uid: string,
	attempt: Attempt
): Promise<void> {
	const stats = loadStats();
	const existing = stats.find(
		(s) => s.lessonId === attempt.lessonId && s.phraseId === attempt.phraseId
	);
	if (existing) {
		existing.attemptsCount += 1;
		existing.bestScore = Math.max(existing.bestScore, attempt.score);
		existing.lastPracticedAt = Date.now();
	} else {
		stats.push({
			phraseId: attempt.phraseId,
			lessonId: attempt.lessonId,
			attemptsCount: 1,
			bestScore: attempt.score,
			lastPracticedAt: Date.now(),
		});
	}
	saveStats(stats);
	return Promise.resolve();
}

export function mockReadPhraseStats(
	_uid: string,
	lessonId?: string
): Promise<PhraseStat[]> {
	const stats = loadStats();
	const filtered = lessonId
		? stats.filter((s) => s.lessonId === lessonId)
		: stats;
	return Promise.resolve(filtered);
}

export function mockReadPracticeDays(_uid: string): Promise<string[]> {
	const days = Array.from(
		{ length: faker.number.int({ min: 3, max: 12 }) },
		(_, i) => {
			const d = new Date();
			d.setDate(d.getDate() - i);
			return d.toISOString().slice(0, 10);
		}
	);
	return Promise.resolve(days);
}
