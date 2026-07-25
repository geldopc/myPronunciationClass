import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AdminGuard } from "@/components/AdminGuard";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
	return (
		<AdminGuard>
			<Outlet />
		</AdminGuard>
	);
}
