// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { ThemeProvider, useTheme } from "@/providers/Theme"

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button type="button" onClick={toggleTheme}>
      {theme}
    </button>
  )
}

afterEach(() => {
  document.documentElement.classList.remove("dark")
  window.localStorage.clear()
})

describe("ThemeProvider", () => {
  it("toggles the theme and the html class", () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    )

    const button = screen.getByRole("button")
    expect(button.textContent).toBe("light")

    fireEvent.click(button)
    expect(button.textContent).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(window.localStorage.getItem("mpc-theme")).toBe("dark")
  })
})
