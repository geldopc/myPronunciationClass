import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/progress")({ component: ProgressPage })

function ProgressPage() {
  return (
    <main className="container mx-auto max-w-3xl p-4 pt-16">
      <h1 className="text-lg font-semibold">Meu progresso</h1>
    </main>
  )
}
