import { Button } from "@/components/ui/button"
import { useShareLink } from "@/hooks/useShareLink"
import type { Rollups } from "@/lib/progress-model"

export function ShareControl({ rollups }: { rollups: Rollups }) {
  const { shareUrl, creating, create, revoke } = useShareLink(rollups)

  return (
    <div id="share-control" className="flex flex-col gap-3">
      {shareUrl ? (
        <>
          <input
            id="share-url"
            readOnly
            value={shareUrl}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            onFocus={(event) => event.currentTarget.select()}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
            >
              Copy
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void revoke()}
            >
              Revoke
            </Button>
          </div>
        </>
      ) : (
        <Button
          type="button"
          size="sm"
          disabled={creating}
          onClick={() => void create()}
        >
          Share my progress
        </Button>
      )}
    </div>
  )
}
