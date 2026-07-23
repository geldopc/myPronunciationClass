import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"

import { TopBar } from "@/components/TopBar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createLesson } from "@/lib/lessons"
import { useAuth } from "@/providers/Auth"

export const Route = createFileRoute("/admin/lessons/new")({
  component: NewLessonPage,
})

function parseYouTubeId(value: string): string | null {
  const clean = value.trim()
  try {
    const url = new URL(clean)
    return url.searchParams.get("v") ?? url.pathname.split("/").pop() ?? null
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) return clean
    return null
  }
}

async function fetchThumbnail(youtubeId: string): Promise<string> {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
  const res = await fetch(url)
  if (!res.ok) return `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
  const data = (await res.json()) as { thumbnail_url?: string }
  return (
    data.thumbnail_url ??
    `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
  )
}

function NewLessonPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState("")
  const [youtubeInput, setYoutubeInput] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const youtubeId = parseYouTubeId(youtubeInput)
    if (!youtubeId) {
      setError("Invalid YouTube URL or ID.")
      return
    }
    if (!title.trim()) {
      setError("Title is required.")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const thumbnailUrl = await fetchThumbnail(youtubeId)
      const lessonId = await createLesson({
        title: title.trim(),
        youtubeId,
        thumbnailUrl,
        createdBy: user.uid,
      })
      navigate({ to: "/admin/lessons/$lessonId", params: { lessonId } })
    } catch {
      setError("Failed to create lesson. Try again.")
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar backTo="/admin" />
      <main
        id="new-lesson-page"
        className="container mx-auto max-w-lg space-y-6 px-4 py-8"
      >
        <h1 className="text-2xl font-semibold">New lesson</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="lesson-title">Title</Label>
            <Input
              id="lesson-title"
              value={title}
              placeholder="e.g. Friends S5E14"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="lesson-yt">YouTube URL or ID</Label>
            <Input
              id="lesson-yt"
              value={youtubeInput}
              placeholder="https://youtube.com/watch?v=… or dQw4w9WgXcQ"
              onChange={(e) => setYoutubeInput(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Add lesson"}
          </Button>
        </form>
      </main>
    </>
  )
}
