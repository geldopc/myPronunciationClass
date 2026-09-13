import { createFileRoute, Outlet } from "@tanstack/react-router";

import { TeacherGuard } from "@/components/TeacherGuard";

export const Route = createFileRoute("/teachers")({
	component: TeachersLayout,
});

function TeachersLayout() {
	return (
		<TeacherGuard>
			<Outlet />
		</TeacherGuard>
	);
}
