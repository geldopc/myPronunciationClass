import { createFileRoute } from "@tanstack/react-router"

import { ListeningSpeakingApp } from "@/components/ListeningSpeakingApp"

export const Route = createFileRoute("/")({ component: HomePage })

function HomePage() {
  return <ListeningSpeakingApp />
}
