import { createFileRoute, Link } from "@tanstack/react-router";

import { ClipEditor } from "@/components/ClipEditor";
import { SideNav } from "@/components/SideNav";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLesson } from "@/hooks/useLesson";

export const Route = createFileRoute("/admin/lessons/$lessonId")({
	component: ClipEditorPage,
});

function ClipEditorPage() {
	const { lessonId } = Route.useParams();
	const { lesson, loading } = useLesson(lessonId);

	if (loading) {
		return (
			<div className="flex min-h-screen flex-col lg:flex-row">
				<SideNav />
				<div
					id="clip-editor-loading"
					className="flex min-w-0 flex-1 items-center justify-center"
				>
					<span className="text-sm text-muted-foreground">Loading…</span>
				</div>
			</div>
		);
	}

	if (!lesson) {
		return (
			<div className="flex min-h-screen flex-col lg:flex-row">
				<SideNav />
				<div
					id="clip-editor-not-found"
					className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4"
				>
					<p className="text-sm text-muted-foreground">Lesson not found.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen flex-col lg:flex-row">
			<SideNav />
			<main
				id="clip-editor-page"
				className="w-full min-w-0 max-w-7xl flex-1 space-y-6 px-4 py-8 sm:px-6 lg:px-8"
			>
				<div className="space-y-1">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbLink asChild>
									<Link to="/admin/lessons">Clips</Link>
								</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>Clip Editor</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
					<h1 className="text-xl font-semibold">{lesson.title}</h1>
				</div>
				<ClipEditor lessonId={lessonId} videoId={lesson.youtubeId} />
			</main>
		</div>
	);
}
