import { Logo } from "@/components/Logo"

export function TopBar() {
  return (
    <header
      id="top-bar"
      className="sticky top-0 z-20 border-b border-border/30 bg-background/50 backdrop-blur-xl"
    >
      <div className="container mx-auto max-w-3xl px-4 py-3">
        <Logo className="h-9 w-auto" />
      </div>
    </header>
  )
}
