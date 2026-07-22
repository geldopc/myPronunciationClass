import { ProgressDashboard } from "@/components/ProgressDashboard"
import { ShareControl } from "@/components/ShareControl"
import { useLesson } from "@/hooks/useLesson"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"

const HARDCODED_LESSON_ID = "friends-s5e14"

export function ProgressView() {
  const { user } = useAuth()
  const { phrases } = useLesson(HARDCODED_LESSON_ID)
  const { rollups, phraseStats } = useProgress(HARDCODED_LESSON_ID, phrases.length)

  if (!user) return null

  return (
    <main
      id="progress-view"
      className="container mx-auto max-w-3xl space-y-8 px-4 py-8 pb-24"
    >
      <ProgressDashboard
        rollups={rollups}
        phraseStats={phraseStats}
        phrases={phrases}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />
      <ShareControl rollups={rollups} />
    </main>
  )
}
