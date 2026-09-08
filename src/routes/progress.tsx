import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ProgressView } from "@/components/ProgressView";
import { SideNav } from "@/components/SideNav";
import { useAuth } from "@/providers/Auth";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
	const { user, loading } = useAuth();
	if (loading) return null;
	if (!user) return <Navigate to="/" />;
	return (
		<div className="flex min-h-screen flex-col lg:flex-row">
			<SideNav />
			<ProgressView />
		</div>
	);
}
