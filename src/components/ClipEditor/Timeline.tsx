import type { Phrase } from "@/lib/lessons"

type Props = {
  phrases: Phrase[]
  duration: number
  selectedPhraseId: string | null
  pendingStart: number | null
  pendingEnd: number | null
  onSelectPhrase: (id: string) => void
}

const COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
]

function timeToX(time: number, duration: number): number {
  if (duration <= 0) return 0
  return Math.min((time / duration) * 1000, 1000)
}

export function Timeline({
  phrases,
  duration,
  selectedPhraseId,
  pendingStart,
  pendingEnd,
  onSelectPhrase,
}: Props) {
  const sorted = [...phrases].sort((a, b) => a.startTime - b.startTime)

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (duration <= 0) return
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    const clickedTime = relX * duration

    const hit = sorted.find(
      (p) => clickedTime >= p.startTime && clickedTime <= p.endTime
    )
    if (hit) onSelectPhrase(hit.id)
  }

  const hasPending =
    pendingStart !== null && pendingEnd !== null && pendingEnd > pendingStart

  return (
    <svg
      id="clip-editor-timeline"
      viewBox="0 0 1000 60"
      preserveAspectRatio="none"
      className="w-full cursor-pointer rounded-md border border-border"
      style={{ height: 60 }}
      onClick={handleClick}
    >
      <rect
        x={0}
        y={8}
        width={1000}
        height={44}
        rx={4}
        fill="hsl(var(--muted))"
      />

      {sorted.map((phrase, i) => {
        const x = timeToX(phrase.startTime, duration)
        const w = Math.max(timeToX(phrase.endTime, duration) - x, 8)
        const isSelected = phrase.id === selectedPhraseId
        const color = COLORS[i % COLORS.length]

        return (
          <g key={phrase.id}>
            <rect
              x={x}
              y={8}
              width={w}
              height={44}
              rx={3}
              fill={color}
              fillOpacity={isSelected ? 1 : 0.7}
              stroke={isSelected ? "white" : "none"}
              strokeWidth={isSelected ? 2 : 0}
            />
            {w > 18 && (
              <text
                x={x + w / 2}
                y={34}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={11}
                fill="white"
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {phrase.order}
              </text>
            )}
          </g>
        )
      })}

      {hasPending && (
        <rect
          x={timeToX(pendingStart!, duration)}
          y={8}
          width={Math.max(
            timeToX(pendingEnd!, duration) - timeToX(pendingStart!, duration),
            4
          )}
          height={44}
          rx={3}
          fill="white"
          fillOpacity={0.35}
          stroke="white"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          style={{ pointerEvents: "none" }}
        />
      )}

      {Array.from({ length: 11 }, (_, i) => i / 10).map((pct) => (
        <line
          key={pct}
          x1={pct * 1000}
          y1={52}
          x2={pct * 1000}
          y2={56}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={0.8}
          strokeOpacity={0.5}
        />
      ))}
    </svg>
  )
}
