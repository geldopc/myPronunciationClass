// @vitest-environment jsdom
/* eslint-disable import/first -- vi.mock hoisting requires imports after mocks */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/lessons", () => ({
	fetchLessons: vi.fn().mockResolvedValue([
		{
			id: "friends-s5e14",
			title: "Friends S5E14",
			youtubeId: "XZVHmRvfDHM",
			thumbnailUrl: "https://img.youtube.com/vi/XZVHmRvfDHM/hqdefault.jpg",
			createdAt: 1700000000000,
			createdBy: "system",
		},
	]),
}));

import { useLessons } from "@/hooks/useLessons";

describe("useLessons", () => {
	it("starts loading and resolves lessons", async () => {
		const { result } = renderHook(() => useLessons());
		expect(result.current.loading).toBe(true);
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.lessons).toHaveLength(1);
		expect(result.current.lessons[0].id).toBe("friends-s5e14");
	});
});
