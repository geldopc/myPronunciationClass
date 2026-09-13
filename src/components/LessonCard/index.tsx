import { Link } from "@tanstack/react-router";
import { PencilIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Lesson } from "@/lib/lessons";

type Props = {
	lesson: Lesson;
	completion: number;
	lastPracticedAt: number | null;
	onClick: () => void;
	isTeacher?: boolean;
	onTogglePublish?: () => void;
};

export function LessonCard({
	lesson,
	completion,
	lastPracticedAt,
	onClick,
	isTeacher = false,
	onTogglePublish,
}: Props) {
	const lastDate = lastPracticedAt
		? new Date(lastPracticedAt).toLocaleDateString()
		: null;

	return (
		<div
			id={`lesson-card-${lesson.id}`}
			className="group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/30"
		>
			<button
				type="button"
				onClick={onClick}
				className="flex flex-col text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
			>
				<div className="relative aspect-video w-full overflow-hidden bg-muted">
					<img
						src={lesson.thumbnailUrl}
						alt={lesson.title}
						className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
					/>
					{completion > 0 && (
						<div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
							{completion}%
						</div>
					)}
				</div>

				<div className="flex flex-col gap-1 p-4">
					<div className="flex items-center gap-2">
						<p className="line-clamp-2 flex-1 text-sm leading-snug font-semibold">
							{lesson.title}
						</p>
						{isTeacher && (
							<Badge
								variant={lesson.status === "published" ? "default" : "outline"}
							>
								{lesson.status}
							</Badge>
						)}
					</div>
					<div className="flex items-center justify-between text-xs text-muted-foreground">
						<span>{lesson.phraseCount} phrases</span>
						{lastDate && <span>Last: {lastDate}</span>}
					</div>

					{completion > 0 && (
						<div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-green-500 transition-all"
								style={{ width: `${completion}%` }}
							/>
						</div>
					)}
				</div>
			</button>

			{isTeacher && (
				<div className="flex items-center justify-end gap-1 border-t border-border px-2 py-1.5">
					<Button
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-xs"
						onClick={onTogglePublish}
					>
						{lesson.status === "published" ? "Unpublish" : "Publish"}
					</Button>
					<Button
						asChild
						size="sm"
						variant="ghost"
						className="h-7 px-2 text-xs"
					>
						<Link to="/lessons/edit/$lessonId" params={{ lessonId: lesson.id }}>
							<PencilIcon className="h-3.5 w-3.5" />
							Edit
						</Link>
					</Button>
				</div>
			)}
		</div>
	);
}
