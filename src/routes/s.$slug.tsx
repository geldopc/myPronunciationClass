import { createFileRoute } from "@tanstack/react-router"

import { ShareView } from "@/components/ShareView"

export const Route = createFileRoute("/s/$slug")({ component: SharePage })

function SharePage() {
  const { slug } = Route.useParams()
  return <ShareView slug={slug} />
}
