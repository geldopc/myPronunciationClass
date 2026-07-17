import { ProgressDashboard } from "@/components/ProgressDashboard"
import { ShareControl } from "@/components/ShareControl"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"

export function ProgressView() {
  const { user } = useAuth()
  const { rollups, phraseStats } = useProgress()

  if (!user) return null

  return (
    <main
      id="progress-view"
      className="container mx-auto max-w-3xl space-y-8 px-4 py-8 pb-24"
    >
      <ProgressDashboard
        rollups={rollups}
        phraseStats={phraseStats}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />
      <ShareControl rollups={rollups} />
    </main>
  )
}
