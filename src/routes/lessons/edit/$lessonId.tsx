import { createFileRoute, Link } from "@tanstack/react-router";

import { AdminGuard } from "@/components/AdminGuard";
import { ClipEditor } from "@/components/ClipEditor";
import { TopBar } from "@/components/TopBar";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLesson } from "@/hooks/useLesson";

export const Route = createFileRoute("/lessons/edit/$lessonId")({
	component: LessonEditPage,
});

function LessonEditPage() {
	const { lessonId } = Route.useParams();
	const { lesson, loading } = useLesson(lessonId);

	return (
		<AdminGuard>
			{loading ? (
				<>
					<TopBar />
					<div
						id="clip-editor-loading"
						className="flex min-h-screen items-center justify-center"
					>
						<span className="text-sm text-muted-foreground">Loading…</span>
					</div>
				</>
			) : !lesson ? (
				<>
					<TopBar />
					<div
						id="clip-editor-not-found"
						className="flex min-h-screen flex-col items-center justify-center gap-4"
					>
						<p className="text-sm text-muted-foreground">Lesson not found.</p>
					</div>
				</>
			) : (
				<>
					<TopBar />
					<main
						id="clip-editor-page"
						className="w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8"
					>
						<div className="space-y-1">
							<Breadcrumb>
								<BreadcrumbList>
									<BreadcrumbItem>
										<BreadcrumbLink asChild>
											<Link to="/lessons">Lessons</Link>
										</BreadcrumbLink>
									</BreadcrumbItem>
									<BreadcrumbSeparator />
									<BreadcrumbItem>
										<BreadcrumbPage>Edit</BreadcrumbPage>
									</BreadcrumbItem>
								</BreadcrumbList>
							</Breadcrumb>
							<h1 className="text-xl font-semibold">{lesson.title}</h1>
						</div>
						<ClipEditor lessonId={lessonId} videoId={lesson.youtubeId} />
					</main>
				</>
			)}
		</AdminGuard>
	);
}
