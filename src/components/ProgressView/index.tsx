import { useMemo } from "react";

import { ProgressDashboard } from "@/components/ProgressDashboard";
import { ShareControl } from "@/components/ShareControl";
import { useLesson } from "@/hooks/useLesson";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import type { Lesson } from "@/lib/lessons";
import type { LessonRollup, PhraseStat } from "@/lib/progress-model";
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
	const activeLessonId =
		localStorage.getItem("lessonId") ?? lessons[0]?.id ?? "";
	const { phrases } = useLesson(activeLessonId);
	const { rollups, phraseStats } = useProgress(activeLessonId, phrases.length);

	const byLesson = useMemo(
		() => computeByLesson(lessons, phraseStats),
		[lessons, phraseStats]
	);

	if (!user) return null;

	return (
		<main
			id="progress-view"
			className="w-full min-w-0 max-w-5xl flex-1 px-4 py-6 pb-16 sm:px-6 lg:px-8"
		>
			<div className="mb-6 flex items-center justify-end">
				<ShareControl rollups={rollups} />
			</div>

			<ProgressDashboard
				rollups={rollups}
				phraseStats={phraseStats}
				phrases={phrases}
				byLesson={byLesson}
				lessons={lessons}
			/>
		</main>
	);
}
