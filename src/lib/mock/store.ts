import type { Phrase } from "@/lib/lessons";
import { MOCK_PHRASES } from "@/lib/mock/data";

// Mutable in-memory store — persists within the session in mock mode.
// Use exportPhrases() + the ClipEditor "Export JSON" button to save work to disk.
let phrases: Phrase[] = JSON.parse(JSON.stringify(MOCK_PHRASES)) as Phrase[];

export function getMockPhrases(): Phrase[] {
	return [...phrases].sort((a, b) => a.order - b.order);
}

export function mockUpsertPhrase(
	phraseId: string | null,
	data: Omit<Phrase, "id">
): string {
	if (phraseId) {
		phrases = phrases.map((p) =>
			p.id === phraseId ? { id: phraseId, ...data } : p
		);
		return phraseId;
	}
	const id = `phrase-${Date.now()}`;
	phrases = [...phrases, { id, ...data }];
	return id;
}

export function mockDeletePhrase(phraseId: string): void {
	phrases = phrases.filter((p) => p.id !== phraseId);
}

export function exportPhrases(): Phrase[] {
	return [...phrases].sort((a, b) => a.order - b.order);
}
