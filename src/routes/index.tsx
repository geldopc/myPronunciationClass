import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
	const lessonId = localStorage.getItem("lessonId");
	if (lessonId) {
		return <Navigate to="/lessons/$lessonId" params={{ lessonId }} />;
	}
	return <Navigate to="/lessons" />;
}
