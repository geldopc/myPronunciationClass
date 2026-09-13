import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LessonCard } from "@/components/LessonCard";
import { PageShell } from "@/components/PageShell";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { useTeacher } from "@/hooks/useTeacher";
import {
	fetchLessons,
	fetchPublishedLessons,
	type Lesson,
	setLessonStatus,
} from "@/lib/lessons";
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
	const { isTeacher } = useTeacher();
	const { phraseStats } = useProgress();
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [lessonsLoading, setLessonsLoading] = useState(true);

	async function load() {
		setLessonsLoading(true);
		try {
			setLessons(
				isTeacher ? await fetchLessons() : await fetchPublishedLessons()
			);
		} finally {
			setLessonsLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload when teacher status resolves
	useEffect(() => {
		void load();
	}, [isTeacher]);

	const lessonStats = useMemo(
		() => computeLessonStats(lessons, phraseStats),
		[lessons, phraseStats]
	);

	function handleSelect(lessonId: string) {
		localStorage.setItem("lessonId", lessonId);
		void navigate({ to: "/lessons/$lessonId", params: { lessonId } });
	}

	async function handleTogglePublish(lesson: Lesson) {
		const next = lesson.status === "published" ? "draft" : "published";
		await setLessonStatus(lesson.id, next);
		await load();
	}

	return (
		<>
			<TopBar />
			<PageShell id="lessons-gallery">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
					<h1 className="text-page-title font-semibold">Lessons</h1>
					{isTeacher && (
						<Button asChild size="sm">
							<Link to="/lessons/new">
								<PlusIcon />
								New lesson
							</Link>
						</Button>
					)}
				</div>

				{lessonsLoading ? (
					<div className="auto-grid">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div
								key={i}
								className="aspect-video w-full animate-pulse rounded-xl bg-muted"
							/>
						))}
					</div>
				) : lessons.length === 0 ? (
					<p className="text-sm text-muted-foreground">No lessons yet.</p>
				) : (
					<div className="auto-grid">
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
									isTeacher={isTeacher}
									onTogglePublish={() => handleTogglePublish(lesson)}
								/>
							);
						})}
					</div>
				)}
			</PageShell>
		</>
	);
}
