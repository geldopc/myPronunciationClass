type ProgressBarProps = {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div id="progress-bar" className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground transition-all"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={completed}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label="Progresso da prática"
        />
      </div>
      <span className="text-sm text-muted-foreground tabular-nums">
        {completed} / {total}
      </span>
    </div>
  )
}
