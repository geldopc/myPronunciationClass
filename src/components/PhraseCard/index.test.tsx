// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { PhraseCard } from "@/components/PhraseCard"
import type { Phrase } from "@/lib/phrases"

afterEach(cleanup)

const phrase: Phrase = {
  id: 1,
  text: "Hello there friend",
  audioSrc: "/audios/frase1.mp3",
  pronunciationHint: "Say it clearly",
  speaker: "Joey",
  startTime: 0,
  endTime: 8.395,
}

const baseProps = {
  phrase,
  isPlaying: false,
  isAnyPhrasePlaying: false,
  isAnyPhraseRecording: false,
  isAnotherPhraseRecording: false,
  supportsSpeechRecognition: true,
  onPlay: () => {},
  onRecordingChange: () => {},
  onEvaluation: () => {},
  registerToggle: () => {},
}

describe("PhraseCard reveal by difficulty", () => {
  it("easy shows text and hint", () => {
    render(<PhraseCard {...baseProps} difficulty="easy" />)
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
  })

  it("moderate shows text, hides hint behind a peek button", () => {
    render(<PhraseCard {...baseProps} difficulty="moderate" />)
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
    expect(screen.queryByText("Show hint")).not.toBeNull()
  })

  it("hard hides text and hint pre-attempt", () => {
    render(<PhraseCard {...baseProps} difficulty="hard" />)
    expect(screen.queryByText("Hello there friend")).toBeNull()
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
  })

  it("shows text, hint and score once attempted, even in hard", () => {
    render(
      <PhraseCard
        {...baseProps}
        difficulty="hard"
        evaluation={{ transcript: "hello there friend", score: 91 }}
      />
    )
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
    expect(screen.queryByText(/Score:/)).not.toBeNull()
  })
})
