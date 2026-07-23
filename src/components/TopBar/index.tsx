import { useRef, useState } from "react"
import { ArrowLeftIcon, ChevronDownIcon, XIcon } from "lucide-react"
import { Link, useNavigate } from "@tanstack/react-router"

import { Logo } from "@/components/Logo"
import { AuthControl } from "@/components/TopBar/AuthControl"
import { ThemeToggle } from "@/components/TopBar/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useLessons } from "@/hooks/useLessons"

function AppInfoDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon className="h-4 w-4" />
          </Button>

          <div className="mb-5 flex items-center gap-3">
            <Logo className="h-10 w-10 shrink-0" />
            <div>
              <h2 className="text-lg leading-tight font-bold">
                myPronunciationClass
              </h2>
              <p className="text-xs text-muted-foreground">
                by nerdzilla · v0.1.0
              </p>
            </div>
          </div>

          <p className="mb-4 text-sm text-muted-foreground">
            Practice English pronunciation using real <em>Friends</em> scenes.
            Listen to native speech, repeat it, and get instant AI feedback on
            how close you sound.
          </p>

          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span>🎯</span>
              <span>
                <strong>Listen &amp; Repeat</strong> — AI scores your
                pronunciation in real time.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>📺</span>
              <span>
                <strong>YouTube clip player</strong> — watch only the segment
                for each phrase.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>🎚️</span>
              <span>
                <strong>Three difficulty levels</strong> — Easy shows hints,
                Hard hides everything.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>📊</span>
              <span>
                <strong>Progress tracking</strong> — sign in to sync across
                devices.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span>⌨️</span>
              <span>
                <strong>Keyboard shortcuts</strong> — Space plays, R records,
                ←/→ navigates.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function LessonSwitcher({ activeLessonId }: { activeLessonId: string }) {
  const { lessons } = useLessons()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const activeLesson = lessons.find((l) => l.id === activeLessonId)

  if (lessons.length < 2) return null

  function select(lessonId: string) {
    localStorage.setItem("lessonId", lessonId)
    setOpen(false)
    void navigate({ to: "/lessons/$lessonId", params: { lessonId } })
  }

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 font-medium"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="max-w-40 truncate">
          {activeLesson?.title ?? "Lessons"}
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <ul
            role="listbox"
            className="absolute top-full left-0 z-40 mt-1 w-64 overflow-hidden rounded-lg border border-border bg-background shadow-lg"
          >
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={lesson.id === activeLessonId}
                  onClick={() => select(lesson.id)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-accent ${
                    lesson.id === activeLessonId
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {lesson.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

export function TopBar({
  backTo,
  lessonId,
}: { backTo?: string; lessonId?: string } = {}) {
  const [showInfo, setShowInfo] = useState(false)

  return (
    <>
      <header
        id="top-bar"
        className="sticky top-0 z-20 border-b border-border/30 bg-background/50 backdrop-blur-xl"
      >
        <div className="container mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            {backTo && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={backTo} aria-label="Back to Lessons">
                  <ArrowLeftIcon className="h-4 w-4" />
                  Lessons
                </Link>
              </Button>
            )}
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-label="About myPronunciationClass"
              className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Logo className="h-9 w-auto" />
            </button>
            {lessonId && <LessonSwitcher activeLessonId={lessonId} />}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <AuthControl />
          </div>
        </div>
      </header>
      {showInfo && <AppInfoDialog onClose={() => setShowInfo(false)} />}
    </>
  )
}
