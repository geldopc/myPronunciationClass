import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useTeacher } from "@/hooks/useTeacher";

export function TeacherGuard({ children }: { children: React.ReactNode }) {
	const { isTeacher, loading } = useTeacher();
	const navigate = useNavigate();

	useEffect(() => {
		if (!loading && !isTeacher) {
			navigate({ to: "/" });
		}
	}, [isTeacher, loading, navigate]);

	if (loading) {
		return (
			<div
				id="teacher-guard-loading"
				className="flex min-h-screen items-center justify-center"
			>
				<span className="text-sm text-muted-foreground">Loading…</span>
			</div>
		);
	}

	if (!isTeacher) return null;

	return <>{children}</>;
}
