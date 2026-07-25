import { useEffect, useState } from "react";
import type { Lesson, Phrase } from "@/lib/lessons";
import { fetchLesson, fetchPhrases } from "@/lib/lessons";

export function useLesson(lessonId: string): {
	lesson: Lesson | null;
	phrases: Phrase[];
	loading: boolean;
} {
	const [lesson, setLesson] = useState<Lesson | null>(null);
	const [phrases, setPhrases] = useState<Phrase[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		setLoading(true);
		Promise.all([fetchLesson(lessonId), fetchPhrases(lessonId)])
			.then(([les, phr]) => {
				setLesson(les);
				setPhrases(phr);
			})
			.finally(() => setLoading(false));
	}, [lessonId]);

	return { lesson, phrases, loading };
}
