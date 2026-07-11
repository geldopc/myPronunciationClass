export type SpineNodeState = "untouched" | "current" | "done"

const stateClass: Record<SpineNodeState, string> = {
  untouched: "border-border bg-background",
  current: "border-foreground bg-background ring-2 ring-ring/40",
  done: "border-foreground bg-foreground",
}

export function SpineNode({
  phraseId,
  state,
}: {
  phraseId: number
  state: SpineNodeState
}) {
  return (
    <span
      id={`spine-node-${phraseId}`}
      aria-hidden
      className={`size-3 shrink-0 rounded-full border-2 ${stateClass[state]}`}
    />
  )
}
