import { useState } from "react"
import { ArrowLeftIcon, XIcon } from "lucide-react"
import { Link } from "@tanstack/react-router"

import { Logo } from "@/components/Logo"
import { AuthControl } from "@/components/TopBar/AuthControl"
import { ThemeToggle } from "@/components/TopBar/ThemeToggle"
import { Button } from "@/components/ui/button"

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

export function TopBar({ backTo }: { backTo?: string } = {}) {
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
              <Link
                to={backTo}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Voltar para Lições"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Lições
              </Link>
            )}
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              aria-label="About myPronunciationClass"
              className="rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Logo className="h-9 w-auto" />
            </button>
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
