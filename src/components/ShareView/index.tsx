import { useEffect, useState } from "react"

import { ProgressStats } from "@/components/ProgressStats"
import { readShare } from "@/lib/shares"
import type { Share } from "@/lib/progress-model"

type LoadState =
  | { status: "loading" }
  | { status: "found"; share: Share }
  | { status: "missing" }

export function ShareView({ slug }: { slug: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    let active = true
    void readShare(slug)
      .then((share) => {
        if (!active) return
        setState(share ? { status: "found", share } : { status: "missing" })
      })
      .catch(() => {
        if (active) setState({ status: "missing" })
      })
    return () => {
      active = false
    }
  }, [slug])

  if (state.status === "loading") {
    return (
      <main
        id="share-view"
        className="container mx-auto max-w-3xl px-4 py-16"
      />
    )
  }

  if (state.status === "missing") {
    return (
      <main
        id="share-view"
        className="container mx-auto max-w-3xl px-4 py-16 text-center"
      >
        <p className="text-muted-foreground">
          Link não encontrado ou revogado.
        </p>
      </main>
    )
  }

  return (
    <main id="share-view" className="container mx-auto max-w-3xl px-4 py-8">
      <ProgressStats
        rollups={state.share.snapshot}
        displayName={state.share.displayName}
        avatarUrl={state.share.avatarUrl}
      />
    </main>
  )
}
