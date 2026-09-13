import { useEffect, useState } from "react";

import { activateTeacher, getTeacherStatus } from "@/lib/teacher";
import { useAuth } from "@/providers/Auth";

export function useTeacher(): { isTeacher: boolean; loading: boolean } {
	const { user } = useAuth();
	const [isTeacher, setIsTeacher] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!user) {
			setIsTeacher(false);
			setLoading(false);
			return;
		}

		let cancelled = false;

		async function check() {
			const status = await getTeacherStatus(user?.email);
			if (cancelled) return;

			if (status === "invited") {
				await activateTeacher(user?.email);
				if (!cancelled) setIsTeacher(true);
			} else if (status === "active") {
				setIsTeacher(true);
			} else {
				setIsTeacher(false);
			}
			if (!cancelled) setLoading(false);
		}

		check();
		return () => {
			cancelled = true;
		};
	}, [user]);

	return { isTeacher, loading };
}
