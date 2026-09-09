import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LessonCard } from "@/components/LessonCard";
import { TopBar } from "@/components/TopBar";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { useProgress } from "@/hooks/useProgress";
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
	const { isAdmin } = useAdmin();
	const { phraseStats } = useProgress();
	const [lessons, setLessons] = useState<Lesson[]>([]);
	const [lessonsLoading, setLessonsLoading] = useState(true);

	async function load() {
		setLessonsLoading(true);
		try {
			setLessons(
				isAdmin ? await fetchLessons() : await fetchPublishedLessons()
			);
		} finally {
			setLessonsLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: reload when admin status resolves
	useEffect(() => {
		void load();
	}, [isAdmin]);

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
			<main
				id="lessons-gallery"
				className="w-full max-w-5xl px-4 py-8 pb-16 sm:px-6 lg:px-8"
			>
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-semibold">Lessons</h1>
					{isAdmin && (
						<Button asChild size="sm">
							<Link to="/lessons/new">
								<PlusIcon />
								New lesson
							</Link>
						</Button>
					)}
				</div>

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
									isAdmin={isAdmin}
									onTogglePublish={() => handleTogglePublish(lesson)}
								/>
							);
						})}
					</div>
				)}
			</main>
		</>
	);
}
