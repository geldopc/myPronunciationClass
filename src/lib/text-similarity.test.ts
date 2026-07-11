import { describe, expect, it } from "vitest";

import {
  getSimilarityPercentage,
  levenshteinDistance,
  normalizeSpeechText,
} from "./text-similarity";

describe("normalizeSpeechText", () => {
  it("lowercases the input", () => {
    expect(normalizeSpeechText("HELLO")).toBe("hello");
  });

  it("strips accents", () => {
    expect(normalizeSpeechText("café")).toBe("cafe");
  });

  it("strips punctuation while keeping words", () => {
    expect(normalizeSpeechText("Hey, you're back!")).toBe("hey you re back");
  });

  it("collapses repeated whitespace", () => {
    expect(normalizeSpeechText("hello    world")).toBe("hello world");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeSpeechText("  hello world  ")).toBe("hello world");
  });
});

describe("levenshteinDistance", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshteinDistance("cat", "cat")).toBe(0);
  });

  it("returns the length of the second string when the first is empty", () => {
    expect(levenshteinDistance("", "cats")).toBe(4);
  });

  it("returns the length of the first string when the second is empty", () => {
    expect(levenshteinDistance("cats", "")).toBe(4);
  });

  it("counts a single substitution as distance 1", () => {
    expect(levenshteinDistance("cat", "bat")).toBe(1);
  });

  it("counts a single insertion as distance 1", () => {
    expect(levenshteinDistance("cat", "cats")).toBe(1);
  });

  it("matches the classic kitten/sitting example", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
  });
});

describe("getSimilarityPercentage", () => {
  it("returns 100 for an exact match", () => {
    expect(getSimilarityPercentage("Hello world", "Hello world")).toBe(100);
  });

  it("returns 100 when only case and punctuation differ", () => {
    expect(getSimilarityPercentage("Hello!", "hello")).toBe(100);
  });

  it("returns a low score for completely different short strings", () => {
    expect(getSimilarityPercentage("hello", "goodbye")).toBeLessThan(50);
  });

  it("returns 0 when the target is empty", () => {
    expect(getSimilarityPercentage("", "hello")).toBe(0);
  });

  it("returns 0 when the transcript is empty", () => {
    expect(getSimilarityPercentage("hello", "")).toBe(0);
  });

  it("scores a realistic one-word miss in a longer phrase leniently", () => {
    const target = "Hi. Hey, you're back, too. Yeah.";
    const transcript = "Hi. Hey, you're here, too. Yeah.";

    expect(getSimilarityPercentage(target, transcript)).toBeGreaterThanOrEqual(70);
  });
});
