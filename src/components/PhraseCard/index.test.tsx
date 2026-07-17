// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { PhraseCard } from "@/components/PhraseCard"
import { getExtraTip } from "@/lib/pronunciationTips"
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

  it("moderate shows text, hides hint behind an inline chip", () => {
    render(<PhraseCard {...baseProps} difficulty="moderate" />)
    expect(screen.queryByText("Hello there friend")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
    expect(screen.queryByRole("button", { name: "Show hint" })).not.toBeNull()
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

describe("PhraseCard hint chip (moderate mode)", () => {
  it("chip is absent in easy mode", () => {
    render(<PhraseCard {...baseProps} difficulty="easy" />)
    expect(screen.queryByRole("button", { name: "Show hint" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Hide hint" })).toBeNull()
  })

  it("clicking the chip reveals the carousel", () => {
    render(<PhraseCard {...baseProps} difficulty="moderate" />)
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Show hint" }))
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
  })

  it("clicking the chip again hides the carousel", () => {
    render(<PhraseCard {...baseProps} difficulty="moderate" />)
    fireEvent.click(screen.getByRole("button", { name: "Show hint" }))
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Hide hint" }))
    expect(screen.queryByText(/Say it clearly/)).toBeNull()
  })
})

describe("PhraseCard tip carousel", () => {
  it("slide 0 shows pronunciationHint with Phonetic tip label", () => {
    render(<PhraseCard {...baseProps} difficulty="easy" />)
    expect(screen.queryByText("Phonetic tip")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
  })

  it("clicking dot 1 switches to Technique tip", () => {
    render(<PhraseCard {...baseProps} difficulty="easy" />)
    fireEvent.click(screen.getByRole("button", { name: "Tip 2" }))
    expect(screen.queryByText("Technique tip")).not.toBeNull()
    expect(screen.queryByText(getExtraTip(phrase.id))).not.toBeNull()
  })

  it("clicking dot 0 after dot 1 returns to Phonetic tip", () => {
    render(<PhraseCard {...baseProps} difficulty="easy" />)
    fireEvent.click(screen.getByRole("button", { name: "Tip 2" }))
    fireEvent.click(screen.getByRole("button", { name: "Tip 1" }))
    expect(screen.queryByText("Phonetic tip")).not.toBeNull()
    expect(screen.queryByText(/Say it clearly/)).not.toBeNull()
  })
})
