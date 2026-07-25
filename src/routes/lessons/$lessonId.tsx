import { createFileRoute, Navigate } from "@tanstack/react-router";

import { ListeningSpeakingApp } from "@/components/ListeningSpeakingApp";
import { useLesson } from "@/hooks/useLesson";

export const Route = createFileRoute("/lessons/$lessonId")({
	component: LessonPracticePage,
});

function LessonPracticePage() {
	const { lessonId } = Route.useParams();
	const { lesson, loading } = useLesson(lessonId);

	if (!loading && lesson === null) {
		return <Navigate to="/lessons" />;
	}

	return <ListeningSpeakingApp lessonId={lessonId} />;
}
