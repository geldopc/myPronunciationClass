import { ProgressStats } from "@/components/ProgressStats"
import { ShareControl } from "@/components/ShareControl"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"

export function ProgressView() {
  const { user } = useAuth()
  const { rollups } = useProgress()

  if (!user) return null

  return (
    <main id="progress-view" className="container mx-auto max-w-3xl px-4 py-8">
      <ProgressStats
        rollups={rollups}
        displayName={user.displayName}
        avatarUrl={user.avatarUrl}
      />
      <div className="mt-8">
        <ShareControl rollups={rollups} />
      </div>
    </main>
  )
}
