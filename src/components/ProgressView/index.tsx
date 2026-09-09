import { useEffect, useMemo, useState } from "react";

import { ProgressDashboard } from "@/components/ProgressDashboard";
import { ShareControl } from "@/components/ShareControl";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import { fetchPhrases, type Lesson } from "@/lib/lessons";
import type {
	LessonRollup,
	PhraseInfo,
	PhraseStat,
} from "@/lib/progress-model";
import { useAuth } from "@/providers/Auth";

function computeByLesson(
	lessons: Lesson[],
	phraseStats: PhraseStat[]
): LessonRollup[] {
	const grouped = new Map<string, PhraseStat[]>();
	for (const s of phraseStats) {
		const arr = grouped.get(s.lessonId) ?? [];
		arr.push(s);
		grouped.set(s.lessonId, arr);
	}
	return lessons
		.map((lesson) => {
			const stats = grouped.get(lesson.id) ?? [];
			const practiced = stats.filter((s) => s.attemptsCount > 0);
			const total = lesson.phraseCount ?? 0;
			const completion =
				total === 0 ? 0 : Math.round((practiced.length / total) * 100);
			const average =
				practiced.length === 0
					? 0
					: Math.round(
							practiced.reduce((sum, s) => sum + s.bestScore, 0) /
								practiced.length
						);
			const lastAt =
				practiced.length === 0
					? null
					: Math.max(...practiced.map((s) => s.lastPracticedAt));
			return {
				lessonId: lesson.id,
				completion,
				average,
				lastPracticedAt: lastAt,
			};
		})
		.filter((r) => r.completion > 0 || grouped.has(r.lessonId));
}

export function ProgressView() {
	const { user } = useAuth();
	const { lessons } = useLessons();

	const totalPhraseCount = useMemo(
		() => lessons.reduce((sum, l) => sum + (l.phraseCount ?? 0), 0),
		[lessons]
	);

	// No lessonId => stats across every lesson the user has practiced, not
	// just whichever one they last opened.
	const { rollups, phraseStats } = useProgress(undefined, totalPhraseCount);

	const [phraseInfoById, setPhraseInfoById] = useState<Map<string, PhraseInfo>>(
		new Map()
	);

	useEffect(() => {
		if (lessons.length === 0) return;
		let active = true;
		Promise.all(
			lessons.map(async (lesson) => {
				const phrases = await fetchPhrases(lesson.id);
				return phrases.map(
					(p) => [p.id, { text: p.text, lessonId: lesson.id }] as const
				);
			})
		).then((entries) => {
			if (active) setPhraseInfoById(new Map(entries.flat()));
		});
		return () => {
			active = false;
		};
	}, [lessons]);

	const byLesson = useMemo(
		() => computeByLesson(lessons, phraseStats),
		[lessons, phraseStats]
	);

	if (!user) return null;

	return (
		<main
			id="progress-view"
			className="w-full max-w-5xl px-4 py-6 pb-16 sm:px-6 lg:px-8"
		>
			<div className="mb-6 flex items-center justify-between gap-4">
				<h1 className="text-2xl font-semibold">My progress</h1>
				<ShareControl rollups={rollups} />
			</div>

			<ProgressDashboard
				rollups={rollups}
				phraseStats={phraseStats}
				byLesson={byLesson}
				lessons={lessons}
				phraseInfoById={phraseInfoById}
			/>
		</main>
	);
}
