import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ClipEditor } from "@/components/ClipEditor"
import { useLesson } from "@/hooks/useLesson"

export const Route = createFileRoute("/admin/lessons/$lessonId")({
  component: ClipEditorPage,
})

function ClipEditorPage() {
  const { lessonId } = Route.useParams()
  const { lesson, loading } = useLesson(lessonId)

  if (loading) {
    return (
      <div
        id="clip-editor-loading"
        className="flex min-h-screen items-center justify-center"
      >
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    )
  }

  if (!lesson) {
    return (
      <div
        id="clip-editor-not-found"
        className="flex min-h-screen flex-col items-center justify-center gap-4"
      >
        <p className="text-sm text-muted-foreground">Lesson not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">← Back to admin</Link>
        </Button>
      </div>
    )
  }

  return (
    <main
      id="clip-editor-page"
      className="container mx-auto max-w-5xl space-y-6 px-4 py-8"
    >
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin">
            <ArrowLeft />
            Lessons
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">{lesson.title}</h1>
      </div>

      <ClipEditor lessonId={lessonId} videoId={lesson.youtubeId} />
    </main>
  )
}
