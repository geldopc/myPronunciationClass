import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ProgressView } from "@/components/ProgressView";
import { TopBar } from "@/components/TopBar";
import { useAuth } from "@/providers/Auth";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
	const { user, loading } = useAuth();
	if (loading) return null;
	if (!user) return <Navigate to="/" />;
	return (
		<>
			<TopBar />
			<ProgressView />
		</>
	);
}
