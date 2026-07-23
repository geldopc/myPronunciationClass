import { ArrowLeftIcon } from "lucide-react"
import { createFileRoute, Link } from "@tanstack/react-router"

import { ClipEditor } from "@/components/ClipEditor"
import { TopBar } from "@/components/TopBar"
import { Button } from "@/components/ui/button"
import { useLesson } from "@/hooks/useLesson"

export const Route = createFileRoute("/admin/lessons/$lessonId")({
  component: ClipEditorPage,
})

function ClipEditorPage() {
  const { lessonId } = Route.useParams()
  const { lesson, loading } = useLesson(lessonId)

  if (loading) {
    return (
      <>
        <TopBar />
        <div
          id="clip-editor-loading"
          className="flex min-h-screen items-center justify-center"
        >
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      </>
    )
  }

  if (!lesson) {
    return (
      <>
        <TopBar />
        <div
          id="clip-editor-not-found"
          className="flex min-h-screen flex-col items-center justify-center gap-4"
        >
          <p className="text-sm text-muted-foreground">Lesson not found.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar />
      <main
        id="clip-editor-page"
        className="container mx-auto max-w-5xl space-y-6 px-4 py-8"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <Link to="/admin">
              <ArrowLeftIcon className="h-4 w-4" />
              Admin
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">{lesson.title}</h1>
        </div>
        <ClipEditor lessonId={lessonId} videoId={lesson.youtubeId} />
      </main>
    </>
  )
}
