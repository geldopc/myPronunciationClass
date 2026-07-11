import { Button } from "@/components/ui/button"
import type { Difficulty } from "@/lib/difficulty"

const options: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Fácil" },
  { value: "moderate", label: "Médio" },
  { value: "hard", label: "Difícil" },
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
      aria-label="Nível de dificuldade"
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
          {option.label}
        </Button>
      ))}
    </div>
  )
}
