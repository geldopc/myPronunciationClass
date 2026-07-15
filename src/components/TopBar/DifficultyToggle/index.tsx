import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/difficulty"

const options: { value: Difficulty; label: string; short: string }[] = [
  { value: "easy", label: "Easy", short: "E" },
  { value: "moderate", label: "Medium", short: "M" },
  { value: "hard", label: "Hard", short: "H" },
]

type DifficultyToggleProps = {
  value: Difficulty
  onChange: (value: Difficulty) => void
}

export function DifficultyToggle({ value, onChange }: DifficultyToggleProps) {
  return (
    <div
      id="difficulty-toggle"
      role="radiogroup"
      aria-label="Difficulty level"
      className="inline-flex gap-1 rounded-4xl border border-border p-1"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          size="sm"
          variant={value === option.value ? "default" : "ghost"}
          onClick={() => onChange(option.value)}
        >
          <span className="hidden sm:inline">{option.label}</span>
          <span className="sm:hidden">{option.short}</span>
        </Button>
      ))}
    </div>
  )
}
