import { useEffect } from "react"
import { useNavigate } from "@tanstack/react-router"

import { useAdmin } from "@/hooks/useAdmin"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate({ to: "/" })
    }
  }, [isAdmin, loading, navigate])

  if (loading) {
    return (
      <div
        id="admin-guard-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    )
  }

  if (!isAdmin) return null

  return <>{children}</>
}
