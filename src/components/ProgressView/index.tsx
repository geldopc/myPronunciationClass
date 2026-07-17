import { ProgressDashboard } from "@/components/ProgressDashboard"
import { ShareControl } from "@/components/ShareControl"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"

export function ProgressView() {
  const { user } = useAuth()
  const { rollups, phraseStats } = useProgress()

  if (!user) return null

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8 pb-24 space-y-8">
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
