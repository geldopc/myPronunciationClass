import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProgressDashboard } from "@/components/ProgressDashboard"
import { ShareControl } from "@/components/ShareControl"
import { useLesson } from "@/hooks/useLesson"
import { useProgress } from "@/hooks/useProgress"
import { useAuth } from "@/providers/Auth"

const HARDCODED_LESSON_ID = "friends-s5e14"

export function ProgressView() {
  const { user } = useAuth()
  const { phrases } = useLesson(HARDCODED_LESSON_ID)
  const { rollups, phraseStats } = useProgress(
    HARDCODED_LESSON_ID,
    phrases.length
  )

  if (!user) return null

  return (
    <main
      id="progress-view"
      className="container mx-auto max-w-5xl px-4 py-6 pb-16"
    >
      {/* Header: user identity + share action always visible */}
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
      />
    </main>
  )
}
