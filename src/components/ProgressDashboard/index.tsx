import { useMemo } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
  Cell,
  ResponsiveContainer,
} from "recharts"
import type { Lesson, Phrase } from "@/lib/lessons"
import type { LessonRollup, PhraseStat, Rollups } from "@/lib/progress-model"

type Props = {
  rollups: Rollups
  phraseStats: PhraseStat[]
  phrases: Phrase[]
  byLesson?: LessonRollup[]
  lessons?: Lesson[]
}

type ChartEntry = {
  phraseId: string
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
  const size = 128
  const cx = size / 2
  const donutEndAngle = 90 - (360 * value) / 100

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className="absolute inset-0">
        <RadialBarChart
          width={size}
          height={size}
          cx={cx}
          cy={cx}
          innerRadius={36}
          outerRadius={56}
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
      {value > 0 && (
        <div className="absolute inset-0">
          <RadialBarChart
            width={size}
            height={size}
            cx={cx}
            cy={cx}
            innerRadius={36}
            outerRadius={56}
            startAngle={90}
            endAngle={donutEndAngle}
            data={[{ value: 1 }]}
          >
            <RadialBar dataKey="value" fill="#22c55e" />
          </RadialBarChart>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold">{value}%</span>
      </div>
    </div>
  )
}

export function ProgressDashboard({ rollups, phraseStats, phrases, byLesson, lessons }: Props) {
  const { chartData, top5, worst5 } = useMemo(() => {
    const data: ChartEntry[] = phrases.map((phrase) => {
      const stat = phraseStats.find((s) => s.phraseId === phrase.id)
      return {
        phraseId: phrase.id,
        bestScore: stat?.bestScore ?? 0,
        attemptsCount: stat?.attemptsCount ?? 0,
      }
    })

    const attempted = phraseStats.filter((s) => s.attemptsCount > 0)
    const best5 = [...attempted]
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 5)
    const bottom5 = [...attempted]
      .sort((a, b) => a.bestScore - b.bestScore)
      .filter((s) => !best5.some((t) => t.phraseId === s.phraseId))
      .slice(0, 5)

    return { chartData: data, top5: best5, worst5: bottom5 }
  }, [phrases, phraseStats])

  return (
    <div id="progress-dashboard" className="space-y-5">
      {/* Metrics row: donut + stat tiles */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-1 sm:shrink-0">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Overall
          </span>
          <DonutChart value={rollups.completion} />
        </div>
        <dl className="grid flex-1 grid-cols-3 gap-3 text-center">
          <div className="flex flex-col-reverse rounded-lg border border-border bg-card p-4">
            <dt className="text-sm text-muted-foreground">Completion</dt>
            <dd className="text-2xl font-bold">{rollups.completion}%</dd>
          </div>
          <div className="flex flex-col-reverse rounded-lg border border-border bg-card p-4">
            <dt className="text-sm text-muted-foreground">Average</dt>
            <dd className="text-2xl font-bold">{rollups.average}</dd>
          </div>
          <div className="flex flex-col-reverse rounded-lg border border-border bg-card p-4">
            <dt className="text-sm text-muted-foreground">Streak</dt>
            <dd className="text-2xl font-bold">{rollups.streak}</dd>
          </div>
        </dl>
      </div>

      {/* Score bar chart — responsive */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Score by Phrase</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: -24, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="phraseId"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="bestScore">
              {chartData.map((entry) => (
                <Cell key={entry.phraseId} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top 5 / Worst 5 phrase lists */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold">Top 5 Phrases</h3>
          {top5.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ol className="space-y-1.5">
              {top5.map((stat) => (
                <li
                  key={stat.phraseId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>Phrase {stat.phraseId}</span>
                  <span className="font-medium text-green-500 dark:text-green-400">
                    {stat.bestScore}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Worst 5 Phrases</h3>
          {worst5.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <ol className="space-y-1.5">
              {worst5.map((stat) => (
                <li
                  key={stat.phraseId}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                >
                  <span>Phrase {stat.phraseId}</span>
                  <span className="font-medium text-red-400 dark:text-red-300">
                    {stat.bestScore}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* Per-lesson progress cards */}
      {byLesson && byLesson.length > 0 && lessons && lessons.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold">Progress by Lesson</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {byLesson.map((row) => {
              const lesson = lessons.find((l) => l.id === row.lessonId)
              if (!lesson) return null
              const lastDate = row.lastPracticedAt
                ? new Date(row.lastPracticedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })
                : null
              return (
                <div
                  key={row.lessonId}
                  id={`lesson-progress-${row.lessonId}`}
                  className="flex gap-3 rounded-xl border border-border bg-card p-3"
                >
                  {lesson.thumbnailUrl && (
                    <img
                      src={lesson.thumbnailUrl}
                      alt={lesson.title}
                      className="h-14 w-24 shrink-0 rounded-md object-cover"
                    />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
                    <p className="line-clamp-2 text-xs font-medium leading-tight">
                      {lesson.title}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{row.completion}% done</span>
                      {lastDate && <span>{lastDate}</span>}
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all"
                        style={{ width: `${row.completion}%` }}
                      />
                    </div>
                    {row.average > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Avg score: {row.average}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
