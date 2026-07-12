import { Navigate, createFileRoute } from "@tanstack/react-router"

import { ProgressView } from "@/components/ProgressView"
import { useAuth } from "@/providers/Auth"

export const Route = createFileRoute("/progress")({ component: ProgressPage })

function ProgressPage() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" />
  return <ProgressView />
}
