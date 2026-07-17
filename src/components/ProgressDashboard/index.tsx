import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadialBarChart,
  RadialBar,
  Cell,
} from "recharts"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { PhraseStat, Rollups } from "@/lib/progress-model"
import { phrases } from "@/lib/phrases"

type Props = {
  rollups: Rollups
  phraseStats: PhraseStat[]
  displayName: string
  avatarUrl: string
}

type ChartEntry = {
  phraseId: number
  bestScore: number
  attemptsCount: number
}

function getBarColor(entry: ChartEntry): string {
  if (entry.attemptsCount === 0) return "hsl(var(--muted-foreground))"
  if (entry.bestScore >= 80) return "#22c55e"
  if (entry.bestScore >= 50) return "#eab308"
  return "#ef4444"
}

interface TooltipPayloadEntry {
  value: number
  payload: ChartEntry
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2 text-sm shadow-md">
      <p className="font-medium">Phrase {payload[0].payload.phraseId}</p>
      <p className="text-muted-foreground">Score: {payload[0].value}</p>
    </div>
  )
}

function DonutChart({ value }: { value: number }) {
  const donutEndAngle = 90 - (360 * value) / 100

  return (
    <div className="relative mx-auto" style={{ width: 192, height: 192 }}>
      {/* Full grey background ring */}
      <div className="absolute inset-0">
        <RadialBarChart
          width={192}
          height={192}
          cx={96}
          cy={96}
          innerRadius={55}
          outerRadius={85}
          startAngle={90}
          endAngle={-270}
          data={[{ value: 1 }]}
        >
          <RadialBar
            dataKey="value"
            fill="hsl(var(--muted))"
            isAnimationActive={false}
          />
        </RadialBarChart>
      </div>
      {/* Progress arc (only rendered when there is progress) */}
      {value > 0 && (
        <div className="absolute inset-0">
          <RadialBarChart
            width={192}
            height={192}
            cx={96}
            cy={96}
            innerRadius={55}
            outerRadius={85}
            startAngle={90}
            endAngle={donutEndAngle}
            data={[{ value: 1 }]}
          >
            <RadialBar dataKey="value" fill="#22c55e" />
          </RadialBarChart>
        </div>
      )}
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

export function ProgressDashboard({
  rollups,
  phraseStats,
  displayName,
  avatarUrl,
}: Props) {
  // Build chart data for all 36 phrases (fill in zeros for not-yet-attempted)
  const chartData: ChartEntry[] = phrases.map((phrase) => {
    const stat = phraseStats.find((s) => s.phraseId === phrase.id)
    return {
      phraseId: phrase.id,
      bestScore: stat?.bestScore ?? 0,
      attemptsCount: stat?.attemptsCount ?? 0,
    }
  })

  // Top 5 and Worst 5 filtered to attempted phrases only
  const attempted = phraseStats.filter((s) => s.attemptsCount > 0)
  const top5 = [...attempted]
    .sort((a, b) => b.bestScore - a.bestScore)
    .slice(0, 5)
  const worst5 = [...attempted]
    .sort((a, b) => a.bestScore - b.bestScore)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* Header with avatar and display name */}
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback>
            {displayName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-xl font-semibold">{displayName}</h2>
      </div>

      {/* Stat tiles row */}
      <dl className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
          <dd className="text-2xl font-bold">{rollups.completion}%</dd>
          <dt className="text-sm text-muted-foreground">Conclusão</dt>
        </div>
        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
          <dd className="text-2xl font-bold">{rollups.average}</dd>
          <dt className="text-sm text-muted-foreground">Média</dt>
        </div>
        <div className="flex flex-col rounded-lg border border-border bg-card p-4">
          <dd className="text-2xl font-bold">{rollups.streak}</dd>
          <dt className="text-sm text-muted-foreground">Sequência</dt>
        </div>
      </dl>

      {/* Completion donut */}
      <div className="flex flex-col items-center gap-2">
        <h3 className="font-semibold">Progresso Geral</h3>
        <DonutChart value={rollups.completion} />
      </div>

      {/* Score bar chart — scrollable on mobile */}
      <div>
        <h3 className="mb-2 font-semibold">Pontuação por Frase</h3>
        <div className="overflow-x-auto">
          <BarChart
            width={720}
            height={220}
            data={chartData}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <XAxis dataKey="phraseId" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bestScore">
              {chartData.map((entry) => (
                <Cell key={entry.phraseId} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </div>
      </div>

      {/* Top 5 / Worst 5 phrase lists */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 font-semibold">Top 5 Frases</h3>
          {top5.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda</p>
          ) : (
            <ol className="space-y-2">
              {top5.map((stat) => (
                <li
                  key={stat.phraseId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>Frase {stat.phraseId}</span>
                  <span className="font-medium text-green-500 dark:text-green-400">
                    {stat.bestScore}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3 className="mb-3 font-semibold">Piores 5 Frases</h3>
          {worst5.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados ainda</p>
          ) : (
            <ol className="space-y-2">
              {worst5.map((stat) => (
                <li
                  key={stat.phraseId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>Frase {stat.phraseId}</span>
                  <span className="font-medium text-red-400 dark:text-red-300">
                    {stat.bestScore}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
