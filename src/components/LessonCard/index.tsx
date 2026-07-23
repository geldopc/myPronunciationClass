import type { Lesson } from "@/lib/lessons"

type Props = {
  lesson: Lesson
  completion: number
  lastPracticedAt: number | null
  onClick: () => void
}

export function LessonCard({
  lesson,
  completion,
  lastPracticedAt,
  onClick,
}: Props) {
  const lastDate = lastPracticedAt
    ? new Date(lastPracticedAt).toLocaleDateString()
    : null

  return (
    <button
      id={`lesson-card-${lesson.id}`}
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-colors hover:border-foreground/30 hover:bg-accent"
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={lesson.thumbnailUrl}
          alt={lesson.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {completion > 0 && (
          <div className="absolute right-2 bottom-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {completion}%
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm leading-snug font-semibold">
          {lesson.title}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{lesson.phraseCount} phrases</span>
          {lastDate && <span>Last: {lastDate}</span>}
        </div>

        {completion > 0 && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
        )}
      </div>
    </button>
  )
}
