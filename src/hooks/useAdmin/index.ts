import { useEffect, useState } from "react";

import { activateAdmin, getAdminStatus } from "@/lib/admin";
import { useAuth } from "@/providers/Auth";

export function useAdmin(): { isAdmin: boolean; loading: boolean } {
	const { user } = useAuth();
	const [isAdmin, setIsAdmin] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setIsAdmin(false);
			setLoading(false);
			return;
		}

		let cancelled = false;

		async function check() {
			const status = await getAdminStatus(user?.email);
			if (cancelled) return;

			if (status === "invited") {
				await activateAdmin(user?.email);
				if (!cancelled) setIsAdmin(true);
			} else if (status === "active") {
				setIsAdmin(true);
			} else {
				setIsAdmin(false);
			}
			if (!cancelled) setLoading(false);
		}

		check();
		return () => {
			cancelled = true;
		};
	}, [user]);

	return { isAdmin, loading };
}
