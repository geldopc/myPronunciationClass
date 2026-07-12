import { ProgressBar } from "@/components/ProgressBar"
import { SpineNode } from "@/components/PhraseList/SpineNode"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { phrases } from "@/lib/phrases"
import type { Rollups } from "@/lib/progress-model"

type ProgressStatsProps = {
  rollups: Rollups
  displayName: string
  avatarUrl: string
}

export function ProgressStats({
  rollups,
  displayName,
  avatarUrl,
}: ProgressStatsProps) {
  const completed = Object.values(rollups.bestScoreByPhrase).length

  return (
    <section id="progress-stats" className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Avatar className="size-9">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback>{displayName.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <span className="text-lg font-semibold tracking-tight">
          {displayName}
        </span>
      </div>

      <ProgressBar completed={completed} total={phrases.length} />

      <dl className="grid grid-cols-3 gap-4 text-center">
        <div>
          <dt className="text-sm text-muted-foreground">Conclusão</dt>
          <dd className="text-2xl font-semibold">{rollups.completion}%</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Média</dt>
          <dd className="text-2xl font-semibold">{rollups.average}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Sequência</dt>
          <dd className="text-2xl font-semibold">{rollups.streak}</dd>
        </div>
      </dl>

      <ul className="flex flex-wrap gap-2">
        {phrases.map((phrase) => (
          <li key={phrase.id} className="flex items-center gap-1">
            <SpineNode
              phraseId={phrase.id}
              state={
                phrase.id in rollups.bestScoreByPhrase ? "done" : "untouched"
              }
            />
            <span className="text-xs text-muted-foreground">
              {rollups.bestScoreByPhrase[phrase.id] ?? "—"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
