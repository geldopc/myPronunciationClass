import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";

import { LessonCard } from "@/components/LessonCard";
import { TopBar } from "@/components/TopBar";
import { useLessons } from "@/hooks/useLessons";
import { useProgress } from "@/hooks/useProgress";
import type { Lesson } from "@/lib/lessons";
import type { PhraseStat } from "@/lib/progress-model";

export const Route = createFileRoute("/lessons/")({ component: LessonsPage });

function computeLessonStats(
	lessons: Lesson[],
	phraseStats: PhraseStat[]
): Map<string, { completion: number; lastPracticedAt: number | null }> {
	const grouped = new Map<string, PhraseStat[]>();
	for (const s of phraseStats) {
		const arr = grouped.get(s.lessonId) ?? [];
		arr.push(s);
		grouped.set(s.lessonId, arr);
	}
	return new Map(
		lessons.map((lesson) => {
			const stats = grouped.get(lesson.id) ?? [];
			const practiced = stats.filter((s) => s.attemptsCount > 0);
			const total = lesson.phraseCount ?? 0;
			const completion =
				total === 0 ? 0 : Math.round((practiced.length / total) * 100);
			const lastAt =
				practiced.length === 0
					? null
					: Math.max(...practiced.map((s) => s.lastPracticedAt));
			return [lesson.id, { completion, lastPracticedAt: lastAt }];
		})
	);
}

function LessonsPage() {
	const navigate = useNavigate();
	const { lessons, loading: lessonsLoading } = useLessons();
	const { phraseStats } = useProgress();

	const lessonStats = useMemo(
		() => computeLessonStats(lessons, phraseStats),
		[lessons, phraseStats]
	);

	function handleSelect(lessonId: string) {
		localStorage.setItem("lessonId", lessonId);
		void navigate({ to: "/lessons/$lessonId", params: { lessonId } });
	}

	return (
		<>
			<TopBar />
			<main
				id="lessons-gallery"
				className="container mx-auto max-w-5xl px-4 py-8 pb-16"
			>
				<h1 className="mb-6 text-2xl font-semibold">Lessons</h1>

				{lessonsLoading ? (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="aspect-video w-full animate-pulse rounded-xl bg-muted"
							/>
						))}
					</div>
				) : lessons.length === 0 ? (
					<p className="text-sm text-muted-foreground">No lessons yet.</p>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{lessons.map((lesson) => {
							const stats = lessonStats.get(lesson.id) ?? {
								completion: 0,
								lastPracticedAt: null,
							};
							return (
								<LessonCard
									key={lesson.id}
									lesson={lesson}
									completion={stats.completion}
									lastPracticedAt={stats.lastPracticedAt}
									onClick={() => handleSelect(lesson.id)}
								/>
							);
						})}
					</div>
				)}
			</main>
		</>
	);
}
