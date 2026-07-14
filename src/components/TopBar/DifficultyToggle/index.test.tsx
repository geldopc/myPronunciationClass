// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { DifficultyToggle } from "@/components/TopBar/DifficultyToggle"

afterEach(cleanup)

describe("DifficultyToggle", () => {
  it("marks the active option and emits changes", () => {
    const onChange = vi.fn()
    render(<DifficultyToggle value="easy" onChange={onChange} />)

    const easy = screen.getByRole("radio", { name: /Fácil/ })
    expect(easy.getAttribute("aria-checked")).toBe("true")

    fireEvent.click(screen.getByRole("radio", { name: /Difícil/ }))
    expect(onChange).toHaveBeenCalledWith("hard")
  })
})
