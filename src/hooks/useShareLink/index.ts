import { useCallback, useEffect, useRef, useState } from "react"

import { createShare, readShareSlug, revokeShare } from "@/lib/shares"
import { useAuth } from "@/providers/Auth"
import type { Rollups } from "@/lib/progress-model"

function buildShareUrl(slug: string): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}s/${slug}`
}

export function useShareLink(rollups: Rollups) {
  const { user } = useAuth()
  const [slug, setSlug] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const userActedRef = useRef(false)

  useEffect(() => {
    userActedRef.current = false
    if (!user) {
      setSlug(null)
      return
    }
    let active = true
    void readShareSlug(user.uid).then((existing) => {
      if (active && !userActedRef.current) setSlug(existing)
    })
    return () => {
      active = false
    }
  }, [user])

  const create = useCallback(async () => {
    if (!user) return
    userActedRef.current = true
    setCreating(true)
    if (slug) await revokeShare(user.uid, slug)
    const created = await createShare(
      user.uid,
      { displayName: user.displayName, avatarUrl: user.avatarUrl },
      rollups
    )
    setSlug(created)
    setCreating(false)
  }, [user, slug, rollups])

  const revoke = useCallback(async () => {
    if (!user || !slug) return
    userActedRef.current = true
    await revokeShare(user.uid, slug)
    setSlug(null)
  }, [user, slug])

  return {
    slug,
    shareUrl: slug ? buildShareUrl(slug) : null,
    creating,
    create,
    revoke,
  }
}
