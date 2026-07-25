// @vitest-environment jsdom
/* eslint-disable import/first -- vi.mock hoisting requires imports after mocks */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lessons", () => ({
	fetchLesson: vi.fn().mockResolvedValue({
		id: "friends-s5e14",
		title: "Friends S5E14",
		youtubeId: "XZVHmRvfDHM",
		thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
		createdAt: 1700000000000,
		createdBy: "system",
	}),
	fetchPhrases: vi.fn().mockResolvedValue([
		{
			id: "phrase-1",
			order: 1,
			text: "Hey!",
			speaker: "Ross",
			pronunciationHint: "tip",
			startTime: 0,
			endTime: 3,
		},
	]),
}));

import { useLesson } from "@/hooks/useLesson";

describe("useLesson", () => {
	it("loads lesson and phrases, resolves loading", async () => {
		const { result } = renderHook(() => useLesson("friends-s5e14"));
		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.lesson?.id).toBe("friends-s5e14");
		expect(result.current.phrases).toHaveLength(1);
		expect(result.current.phrases[0].id).toBe("phrase-1");
	});

	it("returns null lesson when not found", async () => {
		const { fetchLesson } = await import("@/lib/lessons");
		vi.mocked(fetchLesson).mockResolvedValueOnce(null);
		const { result } = renderHook(() => useLesson("missing"));
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.lesson).toBeNull();
	});
});
