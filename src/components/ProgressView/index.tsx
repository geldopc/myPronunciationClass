import { useMemo } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProgressDashboard } from "@/components/ProgressDashboard"
import { ShareControl } from "@/components/ShareControl"
import { useLesson } from "@/hooks/useLesson"
import { useLessons } from "@/hooks/useLessons"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"
import type { LessonRollup, PhraseStat } from "@/lib/progress-model"
import type { Lesson } from "@/lib/lessons"

function computeByLesson(
  lessons: Lesson[],
  phraseStats: PhraseStat[]
): LessonRollup[] {
  const grouped = new Map<string, PhraseStat[]>()
  for (const s of phraseStats) {
    const arr = grouped.get(s.lessonId) ?? []
    arr.push(s)
    grouped.set(s.lessonId, arr)
  }
  return lessons
    .map((lesson) => {
      const stats = grouped.get(lesson.id) ?? []
      const practiced = stats.filter((s) => s.attemptsCount > 0)
      const total = lesson.phraseCount ?? 0
      const completion =
        total === 0 ? 0 : Math.round((practiced.length / total) * 100)
      const average =
        practiced.length === 0
          ? 0
          : Math.round(
              practiced.reduce((sum, s) => sum + s.bestScore, 0) /
                practiced.length
            )
      const lastAt =
        practiced.length === 0
          ? null
          : Math.max(...practiced.map((s) => s.lastPracticedAt))
      return { lessonId: lesson.id, completion, average, lastPracticedAt: lastAt }
    })
    .filter((r) => r.completion > 0 || grouped.has(r.lessonId))
}

const ACTIVE_LESSON_ID = "friends-s5e14"

export function ProgressView() {
  const { user } = useAuth()
  const { lessons } = useLessons()
  const { phrases } = useLesson(ACTIVE_LESSON_ID)
  const { rollups, phraseStats } = useProgress(ACTIVE_LESSON_ID, phrases.length)

  const byLesson = useMemo(
    () => computeByLesson(lessons, phraseStats),
    [lessons, phraseStats]
  )

  if (!user) return null

  return (
    <main
      id="progress-view"
      className="container mx-auto max-w-5xl px-4 py-6 pb-16"
    >
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback>
              {(user.displayName.slice(0, 1) || "?").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{user.displayName}</h2>
        </div>
        <ShareControl rollups={rollups} />
      </div>

      <ProgressDashboard
        rollups={rollups}
        phraseStats={phraseStats}
        phrases={phrases}
        byLesson={byLesson}
        lessons={lessons}
      />
    </main>
  )
}
