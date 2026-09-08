import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Logo } from "@/components/Logo";
import { AuthControl } from "@/components/TopBar/AuthControl";
import { ThemeToggle } from "@/components/TopBar/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useLessons } from "@/hooks/useLessons";

function LessonSwitcher({ activeLessonId }: { activeLessonId: string }) {
	const { lessons } = useLessons();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const activeLesson = lessons.find((l) => l.id === activeLessonId);

	if (lessons.length < 2) return null;

	function select(lessonId: string) {
		localStorage.setItem("lessonId", lessonId);
		setOpen(false);
		void navigate({ to: "/lessons/$lessonId", params: { lessonId } });
	}

	return (
		<div ref={containerRef} className="relative">
			<Button
				variant="ghost"
				size="sm"
				className="gap-1 font-medium"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="listbox"
				aria-expanded={open}
			>
				<span className="max-w-40 truncate">
					{activeLesson?.title ?? "Lessons"}
				</span>
				<ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
			</Button>

			{open && (
				<>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop overlay, keyboard handled by Escape on the menu */}
					<div
						role="presentation"
						className="fixed inset-0 z-30"
						onClick={() => setOpen(false)}
						onKeyDown={() => setOpen(false)}
					/>
					<div
						role="listbox"
						className="absolute top-full left-0 z-40 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
					>
						{lessons.map((lesson) => (
							<button
								key={lesson.id}
								type="button"
								role="option"
								aria-selected={lesson.id === activeLessonId}
								onClick={() => select(lesson.id)}
								className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-accent ${
									lesson.id === activeLessonId
										? "font-medium text-foreground"
										: "text-muted-foreground"
								}`}
							>
								{lesson.title}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export function TopBar({
	backTo,
	lessonId,
}: {
	backTo?: string;
	lessonId?: string;
} = {}) {
	return (
		<header
			id="top-bar"
			className="sticky top-0 z-20 w-full border-b border-border/30 bg-background/50 backdrop-blur-xl"
		>
			<div className="flex w-full items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
				<div className="flex min-w-0 items-center gap-3">
					{backTo && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 shrink-0 text-muted-foreground"
							asChild
						>
							<Link to={backTo} aria-label="Go back">
								<ArrowLeftIcon className="h-4 w-4" />
							</Link>
						</Button>
					)}
					<Link
						to="/lessons"
						aria-label="myPronunciationClass — go to lessons"
						className="flex shrink-0 items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						<Logo className="h-9 w-auto shrink-0" />
						<span className="hidden font-brand text-xl tracking-tight sm:inline">
							My Pronunciation Class
						</span>
					</Link>
					{lessonId && <LessonSwitcher activeLessonId={lessonId} />}
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<ThemeToggle />
					<AuthControl />
				</div>
			</div>
		</header>
	);
}
