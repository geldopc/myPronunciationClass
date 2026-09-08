import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import { SideNav } from "@/components/SideNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	fetchLessons,
	fetchPhrases,
	type Lesson,
	setLessonStatus,
} from "@/lib/lessons";

export const Route = createFileRoute("/admin/lessons/")({
	component: ClipsDashboard,
});

type LessonRow = Lesson & { phraseCount: number };

function ClipsDashboard() {
	const [lessons, setLessons] = useState<LessonRow[]>([]);
	const [loading, setLoading] = useState(true);

	async function load() {
		setLoading(true);
		try {
			const rawLessons = await fetchLessons();
			const rows = await Promise.all(
				rawLessons.map(async (l) => {
					const phrases = await fetchPhrases(l.id);
					return { ...l, phraseCount: phrases.length };
				})
			);
			setLessons(rows);
		} finally {
			setLoading(false);
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
	useEffect(() => {
		void load();
	}, []);

	async function handleToggleStatus(lesson: LessonRow) {
		const next = lesson.status === "published" ? "draft" : "published";
		await setLessonStatus(lesson.id, next);
		await load();
	}

	return (
		<div className="flex min-h-screen flex-col lg:flex-row">
			<SideNav />
			<main
				id="clips-dashboard"
				className="w-full min-w-0 max-w-5xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8"
			>
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-semibold">Clips</h1>
					<Button asChild size="sm">
						<Link to="/admin/lessons/new">New lesson</Link>
					</Button>
				</div>

				{loading ? (
					<p className="text-sm text-muted-foreground">Loading…</p>
				) : lessons.length === 0 ? (
					<p className="text-sm text-muted-foreground">No lessons yet.</p>
				) : (
					<div className="overflow-x-auto rounded-lg border border-border">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/40">
									<th className="px-4 py-2 text-left font-medium">Lesson</th>
									<th className="px-4 py-2 text-center font-medium">Phrases</th>
									<th className="px-4 py-2 text-center font-medium">Status</th>
									<th className="px-4 py-2" />
								</tr>
							</thead>
							<tbody>
								{lessons.map((lesson) => (
									<tr
										key={lesson.id}
										className="border-b border-border last:border-0 hover:bg-muted/20"
									>
										<td className="flex items-center gap-3 px-4 py-3">
											{lesson.thumbnailUrl && (
												<img
													src={lesson.thumbnailUrl}
													alt={lesson.title}
													className="h-10 w-16 rounded object-cover"
												/>
											)}
											<span className="font-medium">{lesson.title}</span>
										</td>
										<td className="px-4 py-3 text-center text-muted-foreground">
											{lesson.phraseCount}
										</td>
										<td className="px-4 py-3 text-center">
											<Badge
												variant={
													lesson.status === "published" ? "default" : "outline"
												}
											>
												{lesson.status}
											</Badge>
										</td>
										<td className="px-4 py-3 text-right">
											<div className="flex justify-end gap-1">
												<Button
													size="sm"
													variant="ghost"
													onClick={() => handleToggleStatus(lesson)}
												>
													{lesson.status === "published"
														? "Unpublish"
														: "Publish"}
												</Button>
												<Button asChild size="sm" variant="ghost">
													<Link
														to="/admin/lessons/$lessonId"
														params={{ lessonId: lesson.id }}
													>
														<Pencil />
														Edit clips
													</Link>
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</main>
		</div>
	);
}
